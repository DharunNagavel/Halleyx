import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import { sendApprovalEmail, sendNotificationEmail } from "../utils/mail.js";
import { aj } from "../arcjet.js";

export const executeWorkflow = async (req, res) => {
  try {
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }

    const { workflow_id } = req.params;
    const bodyData = req.body;

    console.log("Incoming Data:", bodyData);

    // Normalize input values
    const data = {};
    Object.keys(bodyData).forEach((key) => {
      const val = bodyData[key];
      data[key] = !isNaN(val) && val !== "" ? Number(val) : val;
    });

    console.log("Normalized Data:", data);

    const workflowResult = await pool.query(
      "SELECT * FROM workflows WHERE id=$1",
      [workflow_id]
    );

    if (workflowResult.rows.length === 0) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    const workflow = workflowResult.rows[0];
    let currentStepId = workflow.start_step_id;

    // Fallback: If no start_step_id is set, try to find the step with the lowest order
    if (!currentStepId) {
      console.log("No start_step_id found, searching for first step...");
      const firstStepResult = await pool.query(
        'SELECT id FROM steps WHERE workflow_id=$1 ORDER BY "order" ASC LIMIT 1',
        [workflow_id]
      );
      if (firstStepResult.rows.length > 0) {
        currentStepId = firstStepResult.rows[0].id;
        console.log("Found first step via order:", currentStepId);
      }
    }

    console.log("Workflow Data:", workflow);
    console.log("Final Start Step ID:", currentStepId);
    const executionId = uuidv4();
    let logs = [];
    let status = "in_progress";

    while (currentStepId) {

      console.log("Current Step ID:", currentStepId);

      const stepResult = await pool.query(
        "SELECT * FROM steps WHERE id=$1",
        [currentStepId]
      );

      if (stepResult.rows.length === 0) {
        throw new Error("Step not found");
      }

      const step = stepResult.rows[0];

      console.log("Executing Step:", step.name);

      const stepLog = {
        step_name: step.name,
        step_type: step.step_type,
        status: "processing",
        next_step: null
      };

      // APPROVAL STEP
      if (step.step_type === "approval") {

        console.log("Approval step reached. Waiting for approval.");

        // Send Email if configured
        if (step.approver_email) {
          console.log("Sending approval email to:", step.approver_email);
          try {
            await sendApprovalEmail(step.approver_email, executionId, workflow.name, data);
          } catch (mailErr) {
            console.error("Failed to send approval email:", mailErr);
          }
        }

        stepLog.status = "waiting";
        logs.push(stepLog);

        status = "waiting";

        await pool.query(
          `INSERT INTO executions
          (id,workflow_id,workflow_version,status,data,logs,current_step_id,retries,started_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,0,NOW())`,
          [
            executionId,
            workflow_id,
            workflow.version,
            status,
            JSON.stringify(data),
            JSON.stringify(logs),
            step.id
          ]
        );

        return res.json({
          execution_id: executionId,
          status: "waiting",
          current_step_id: step.id,
          logs
        });
      }

      // NOTIFICATION STEP
      if (step.step_type === "notification") {
        console.log("Notification step reached:", step.id);
        if (step.approver_email) {
          try {
            await sendNotificationEmail(step.approver_email, workflow.name, status, data);
          } catch (mailErr) {
            console.error("Failed to send notification email:", mailErr);
          }
        }
        stepLog.status = "notified";
      } else {
        stepLog.status = "completed";
      }

      logs.push(stepLog);

      // Load rules
      const ruleResult = await pool.query(
        "SELECT * FROM rules WHERE step_id=$1 ORDER BY priority ASC",
        [step.id]
      );

      const rules = ruleResult.rows;
      let nextStep = null;
      let matched = false;
      let defaultStep = null;

      if (rules.length === 0) {
        if (step.step_type === "notification") {
          matched = true;
          nextStep = null; // Auto-complete if no rules
        } else {
          throw new Error(`No rules defined for step: ${step.name}`);
        }
      }

      for (const rule of rules) {

        console.log("Checking Rule:", rule.condition);

        if (rule.condition === "DEFAULT") {
          defaultStep = rule.next_step_id;
          continue;
        }

        let condition = rule.condition;

        Object.keys(data).forEach((key) => {
          const regex = new RegExp(`\\b${key}\\b`, "g");
          const value = typeof data[key] === "string" ? `'${data[key]}'` : data[key];
          condition = condition.replace(regex, value);
        });

        // Final safety: Wrap common status words or unquoted strings that aren't reserved/numbers
        // This is a heuristic to help with things like 'reason == medical'
        const reserved = ['true', 'false', 'null', 'undefined', '&&', '||', '!', '==', '!=', '>', '<', '>=', '<='];
        const words = condition.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        words.forEach(word => {
          if (!reserved.includes(word) && isNaN(word)) {
            // Check if it's already quoted
            const regexBefore = new RegExp(`['"]${word}['"]`, 'g');
            if (!regexBefore.test(condition)) {
              const regexWord = new RegExp(`\\b${word}\\b`, 'g');
              condition = condition.replace(regexWord, `'${word}'`);
            }
          }
        });

        console.log("Evaluating Condition:", condition);

        let result = false;

        try {
          result = eval(condition);
          console.log("Evaluation Result:", result);
        } catch (err) {
          console.log("Rule evaluation error:", err);
          throw new Error(`Invalid rule condition: ${rule.condition}`);
        }

        if (result === true) {
          console.log("Rule matched → Next Step:", rule.next_step_id);
          nextStep = rule.next_step_id;
          matched = true;
          break;
        }
      }

      // If no rule matched use DEFAULT
      if (!matched && defaultStep) {
        console.log("No rule matched. Using DEFAULT step:", defaultStep);
        nextStep = defaultStep;
        matched = true;
      }

      if (!matched) {

        console.log("No rules matched and no DEFAULT found");

        stepLog.status = "failed";
        logs.push(stepLog);

        status = "failed";

        await pool.query(
          `INSERT INTO executions 
          (id,workflow_id,workflow_version,status,data,logs,current_step_id,retries,started_at,ended_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,0,NOW(),NOW())`,
          [
            executionId,
            workflow_id,
            workflow.version,
            status,
            JSON.stringify(data),
            JSON.stringify(logs),
            step.id
          ]
        );

        return res.json({
          execution_id: executionId,
          status: "failed",
          logs
        });
      }

      stepLog.status = "completed";
      stepLog.next_step = nextStep;

      logs.push(stepLog);

      console.log("Moving to Next Step:", nextStep);

      currentStepId = nextStep;
    }

    status = "completed";

    console.log("Workflow Completed");

    await pool.query(
      `INSERT INTO executions
      (id,workflow_id,workflow_version,status,data,logs,current_step_id,retries,started_at,ended_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,0,NOW(),NOW())`,
      [
        executionId,
        workflow_id,
        workflow.version,
        status,
        JSON.stringify(data),
        JSON.stringify(logs),
        null
      ]
    );

    res.json({
      execution_id: executionId,
      status: "completed",
      logs
    });

  } catch (error) {

    console.error("Execution Error:", error);

    res.status(500).json({
      message: "Execution failed",
      error: error.message
    });
  }
};

export const respondToApproval = async (req, res) => {

  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }

  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'reject'

  try {
    const executionResult = await pool.query("SELECT * FROM executions WHERE id=$1", [id]);
    if (executionResult.rows.length === 0) {
      return res.status(404).json({ message: "Execution not found" });
    }

    const execution = executionResult.rows[0];
    if (execution.status !== "waiting") {
      return res.status(400).json({ message: "Execution is not waiting for approval" });
    }

    let data = typeof execution.data === 'string' ? JSON.parse(execution.data) : execution.data;
    let logs = typeof execution.logs === 'string' ? JSON.parse(execution.logs) : execution.logs;
    let currentStepId = execution.current_step_id;

    // Record the decision in the data so rules can use it
    data.approval_status = action;

    // Find the current step to mark it as completed/rejected
    const lastLog = logs[logs.length - 1];
    if (action === 'approve') {
      lastLog.status = "approved";
    } else {
      lastLog.status = "rejected";
    }

    let status = "in_progress";
    let nextStep = null;

    // Now evaluate rules for the current step based on the decision
    const ruleResult = await pool.query(
      "SELECT * FROM rules WHERE step_id=$1 ORDER BY priority ASC",
      [currentStepId]
    );

    const rules = ruleResult.rows;
    let matched = false;

    for (const rule of rules) {
      let condition = rule.condition;

      // Inject data including the new approval_status
      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`\\b${key}\\b`, "g");
        const value = typeof data[key] === "string" ? `'${data[key]}'` : data[key];
        condition = condition.replace(regex, value);
      });

      // Safety wrapping for strings
      const reserved = ['true', 'false', 'null', 'undefined', '&&', '||', '!', '==', '!=', '>', '<', '>=', '<='];
      const words = condition.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
      words.forEach(word => {
        if (!reserved.includes(word) && isNaN(word)) {
          const regexBefore = new RegExp(`['"]${word}['"]`, 'g');
          if (!regexBefore.test(condition)) {
            const regexWord = new RegExp(`\\b${word}\\b`, 'g');
            condition = condition.replace(regexWord, `'${word}'`);
          }
        }
      });

      try {
        if (rule.condition === "DEFAULT" || eval(condition) === true) {
          nextStep = rule.next_step_id;
          matched = true;
          break;
        }
      } catch (err) {
        console.error("Rule eval error in respondent:", err);
      }
    }

    if (!matched && action === 'reject') {
      // Default behavior for rejection if no rules match: fail the workflow
      status = "failed";
      currentStepId = null;
    } else if (!matched) {
      // For approval if no rules match and no next step, it might be the end
      status = "completed";
      currentStepId = null;
    } else {
      currentStepId = nextStep;
      // Continue execution loop if there's a next step
      // (Similar to the while loop in executeWorkflow)
      // For simplicity in this one-shot, we'll process the NEXT step only or redirect to a resume logic
    }

    // UPDATE STATE AND RESUME (for now just one step or end)
    await pool.query(
      "UPDATE executions SET status=$1, data=$2, logs=$3, current_step_id=$4, ended_at=$5 WHERE id=$6",
      [
        currentStepId ? "in_progress" : (action === 'approve' ? "completed" : "failed"),
        JSON.stringify(data),
        JSON.stringify(logs),
        currentStepId,
        currentStepId ? null : new Date(),
        id
      ]
    );

    res.json({ message: `Workflow ${action}d successfully`, next_step: currentStepId });

  } catch (err) {
    console.error("Response error:", err);
    res.status(500).json({ message: "Failed to process response" });
  }
};

export const getAllExecutions = async (req, res) => {

  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }

  try {
    const result = await pool.query(`
      SELECT e.*, w.name as workflow_name 
      FROM executions e
      JOIN workflows w ON e.workflow_id = w.id
      ORDER BY e.started_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch executions error:", err);
    res.status(500).json({ message: "Failed to fetch executions" });
  }
};

export const getExecution = async (req, res) => {

  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }

  const result = await pool.query("SELECT * FROM executions WHERE id=$1", [
    req.params.id,
  ]);
  res.json(result.rows[0]);
};

export const cancelExecution = async (req, res) => {

  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }

  await pool.query("UPDATE executions SET status='canceled' WHERE id=$1", [
    req.params.id,
  ]);
  res.json({ status: "canceled" });
};

export const retryExecution = async (req, res) => {

  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }

  await pool.query("UPDATE executions SET retries=retries+1 WHERE id=$1", [
    req.params.id,
  ]);
  res.json({ message: "Retry started" });
};
