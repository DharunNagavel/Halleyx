import pool from "../db.js";
import client from "../redis.js";
import { v4 as uuidv4 } from "uuid";
import { sendApprovalEmail, sendNotificationEmail } from "../utils/mail.js";
import aj from "../arcjet.js";

const runWorkflow = async (res, executionId, workflow, currentStepId, data, logs) => {
  try {
    let status = "in_progress";

    while (currentStepId) {
      console.log(`[${executionId}] Executing step: ${currentStepId}`);
      
      let step;
      const stepCacheKey = `step:${currentStepId}`;
      
      try {
        const cachedStep = await client.get(stepCacheKey);
        if (cachedStep) {
          step = JSON.parse(cachedStep);
        }
      } catch (err) {
        console.error("Step cache error:", err);
      }

      if (!step) {
        const stepResult = await pool.query(
          "SELECT * FROM steps WHERE id=$1",
          [currentStepId]
        );

        if (stepResult.rows.length === 0) {
          throw new Error("Step not found");
        }
        step = stepResult.rows[0];
        
        try {
          await client.setEx(stepCacheKey, 3600, JSON.stringify(step));
        } catch (err) {}
      }

      // Create a new log entry for THIS attempt of the step
      const stepLog = {
        step_name: step.name,
        step_type: step.step_type,
        status: "processing",
        next_step: null,
        started_at: new Date()
      };
      
      // Push it to the local logs array
      logs.push(stepLog);

      // Immediately sync with DB so the UI shows "processing"
      await pool.query(
        "UPDATE executions SET status=$1, data=$2, logs=$3, current_step_id=$4, ended_at=null WHERE id=$5",
        ["in_progress", JSON.stringify(data), JSON.stringify(logs), currentStepId, executionId]
      );

      // Check for cancellation
      const checkResult = await pool.query("SELECT status FROM executions WHERE id=$1", [executionId]);
      if (checkResult.rows[0]?.status === 'canceled') {
        console.log(`[${executionId}] Execution canceled.`);
        // Update the log entry to reflect state
        stepLog.status = "canceled";
        await pool.query("UPDATE executions SET logs=$1 WHERE id=$2", [JSON.stringify(logs), executionId]);
        return res.json({ execution_id: executionId, status: "canceled", logs });
      }

      // APPROVAL STEP
      if (step.step_type === "approval") {
        if (step.approver_email) {
          try {
            await sendApprovalEmail(step.approver_email, executionId, workflow.name, data);
          } catch (mailErr) {
            console.error("Failed to send approval email:", mailErr);
          }
        }

        stepLog.status = "waiting";
        status = "waiting";

        await pool.query(
          "UPDATE executions SET status=$1, data=$2, logs=$3, current_step_id=$4 WHERE id=$5",
          [status, JSON.stringify(data), JSON.stringify(logs), step.id, executionId]
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
        if (step.approver_email) {
          try {
            await sendNotificationEmail(step.approver_email, workflow.name, status, data);
          } catch (mailErr) {
            console.error("Failed to send notification email:", mailErr);
          }
        }
        stepLog.status = "notified";
      }

      // Evaluate rules
      let rules;
      const rulesCacheKey = `rules:step:${step.id}`;

      try {
        const cachedRules = await client.get(rulesCacheKey);
        if (cachedRules) {
          rules = JSON.parse(cachedRules);
        }
      } catch (err) {
        console.error("Rules cache error:", err);
      }

      if (!rules) {
        const ruleResult = await pool.query(
          "SELECT * FROM rules WHERE step_id=$1 ORDER BY priority ASC",
          [step.id]
        );
        rules = ruleResult.rows;

        try {
          await client.setEx(rulesCacheKey, 3600, JSON.stringify(rules));
        } catch (err) {}
      }
      let nextStep = null;
      let matched = false;
      let defaultStep = null;

      if (rules.length === 0) {
        // If no rules are defined, treat as a terminal step
        matched = true;
        nextStep = null;
        stepLog.status = "completed";
        stepLog.notes = "No rules defined for this step. Workflow completed.";
        console.log(`[${executionId}] Terminal step reached: ${step.name} (No rules defined)`);
      }

      for (const rule of rules) {
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
          if (eval(condition) === true) {
            nextStep = rule.next_step_id;
            matched = true;
            break;
          }
        } catch (err) {}
      }

      if (!matched && defaultStep) {
        nextStep = defaultStep;
        matched = true;
      }

      if (!matched) {
        stepLog.status = "failed";
        status = "failed";

        await pool.query(
          "UPDATE executions SET status=$1, data=$2, logs=$3, current_step_id=$4, ended_at=NOW() WHERE id=$5",
          [status, JSON.stringify(data), JSON.stringify(logs), step.id, executionId]
        );

        return res.json({
          execution_id: executionId,
          status: "failed",
          logs
        });
      }

      if (step.step_type !== "notification") {
          stepLog.status = "completed";
      }
      stepLog.next_step = nextStep;
      
      // Move to next step
      currentStepId = nextStep;
      
      // Update state in DB after step success
      await pool.query(
        "UPDATE executions SET status=$1, data=$2, logs=$3, current_step_id=$4 WHERE id=$5",
        ["in_progress", JSON.stringify(data), JSON.stringify(logs), currentStepId, executionId]
      );
    }

    status = "completed";
    await pool.query(
      "UPDATE executions SET status=$1, current_step_id=null, ended_at=NOW() WHERE id=$2",
      [status, executionId]
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

export const executeWorkflow = async (req, res) => {
  try {
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({ message: "Request blocked by Arcjet" });
    }

    const { workflow_id } = req.params;
    const bodyData = req.body;

    const data = {};
    Object.keys(bodyData).forEach((key) => {
      const val = bodyData[key];
      data[key] = !isNaN(val) && val !== "" ? Number(val) : val;
    });

    const workflowResult = await pool.query(
      "SELECT * FROM workflows WHERE id=$1",
      [workflow_id]
    );

    if (workflowResult.rows.length === 0) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    const workflow = workflowResult.rows[0];
    let currentStepId = workflow.start_step_id;

    if (!currentStepId) {
      const firstStepResult = await pool.query(
        'SELECT id FROM steps WHERE workflow_id=$1 ORDER BY "order" ASC LIMIT 1',
        [workflow_id]
      );
      if (firstStepResult.rows.length > 0) {
        currentStepId = firstStepResult.rows[0].id;
      }
    }

    if (!currentStepId) {
        return res.status(400).json({ message: "No steps found for this workflow" });
    }

    const executionId = uuidv4();
    const logs = [];

    // Initial insert
    await pool.query(
      `INSERT INTO executions
      (id, workflow_id, workflow_version, status, data, logs, current_step_id, retries, started_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NOW())`,
      [
        executionId,
        workflow_id,
        workflow.version,
        "in_progress",
        JSON.stringify(data),
        JSON.stringify(logs),
        currentStepId
      ]
    );

    return runWorkflow(res, executionId, workflow, currentStepId, data, logs);

  } catch (error) {
    console.error("Execution Error:", error);
    res.status(500).json({ message: "Execution failed", error: error.message });
  }
};

export const respondToApproval = async (req, res) => {
  const decision = await aj.protect(req);
  if (decision.isDenied()) {
    return res.json({ message: "Request blocked by Arcjet" });
  }

  const { id } = req.params;
  const { action } = req.body; 

  try {
    const executionResult = await pool.query("SELECT e.*, w.name as workflow_name FROM executions e JOIN workflows w ON e.workflow_id = w.id WHERE e.id=$1", [id]);
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

    data.approval_status = action;

    const lastLog = logs[logs.length - 1];
    lastLog.status = action === 'approve' ? "approved" : "rejected";

    const ruleResult = await pool.query(
      "SELECT * FROM rules WHERE step_id=$1 ORDER BY priority ASC",
      [currentStepId]
    );

    const rules = ruleResult.rows;
    let matched = false;
    let nextStep = null;

    for (const rule of rules) {
      let condition = rule.condition;
      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`\\b${key}\\b`, "g");
        const value = typeof data[key] === "string" ? `'${data[key]}'` : data[key];
        condition = condition.replace(regex, value);
      });

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
      } catch (err) {}
    }

    if (!matched) {
        const finalStatus = action === 'approve' ? "completed" : "failed";
        await pool.query(
            "UPDATE executions SET status=$1, data=$2, logs=$3, current_step_id=$4, ended_at=NOW() WHERE id=$5",
            [finalStatus, JSON.stringify(data), JSON.stringify(logs), currentStepId, id]
        );
        return res.json({ message: `Workflow ${action}d successfully`, status: finalStatus });
    }

    // Resume workflow loop
    const workflow = { name: execution.workflow_name };
    return runWorkflow(res, id, workflow, nextStep, data, logs);

  } catch (err) {
    console.error("Response error:", err);
    res.status(500).json({ message: "Failed to process response" });
  }
};

export const getAllExecutions = async (req, res) => {
  const decision = await aj.protect(req);
  if (decision.isDenied()) {
    return res.json({ message: "Request blocked by Arcjet" });
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
    return res.json({ message: "Request blocked by Arcjet" });
  }

  const result = await pool.query("SELECT * FROM executions WHERE id=$1", [
    req.params.id,
  ]);
  res.json(result.rows[0]);
};

export const cancelExecution = async (req, res) => {
  const decision = await aj.protect(req);
  if (decision.isDenied()) {
    return res.json({ message: "Request blocked by Arcjet" });
  }

  await pool.query("UPDATE executions SET status='canceled', ended_at=NOW() WHERE id=$1", [
    req.params.id,
  ]);
  res.json({ status: "canceled" });
};

export const retryExecution = async (req, res) => {
  const decision = await aj.protect(req);
  if (decision.isDenied()) {
    return res.json({ message: "Request blocked by Arcjet" });
  }

  const { id } = req.params;

  try {
    const executionResult = await pool.query("SELECT e.*, w.name as workflow_name FROM executions e JOIN workflows w ON e.workflow_id = w.id WHERE e.id=$1", [id]);
    if (executionResult.rows.length === 0) {
      return res.status(404).json({ message: "Execution not found" });
    }

    const execution = executionResult.rows[0];
    if (execution.status !== "failed" && execution.status !== "canceled") {
      return res.status(400).json({ message: "Only failed or canceled workflows can be retried" });
    }

    let data = typeof execution.data === 'string' ? JSON.parse(execution.data) : execution.data;
    let logs = typeof execution.logs === 'string' ? JSON.parse(execution.logs) : execution.logs;
    let currentStepId = execution.current_step_id;

    // Reset temporary decision data for a clean step retry
    delete data.approval_status;

    // Fallback if currentStepId is missing
    if (!currentStepId) {
        const workflowResult = await pool.query("SELECT start_step_id FROM workflows WHERE id=$1", [execution.workflow_id]);
        currentStepId = workflowResult.rows[0].start_step_id;
    }

    // Reset status to in_progress and increment retries
    await pool.query(
      "UPDATE executions SET status='in_progress', retries=retries+1, ended_at=null WHERE id=$1",
      [id]
    );

    const workflow = { name: execution.workflow_name };
    return runWorkflow(res, id, workflow, currentStepId, data, logs);

  } catch (err) {
    console.error("Retry error:", err);
    res.status(500).json({ message: "Failed to retry execution" });
  }
};
