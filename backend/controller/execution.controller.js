import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

export const executeWorkflow = async (req, res) => {
  try {
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
    console.log("Workflow Data:", workflow);
    console.log("Start Step ID:", workflow.start_step_id);
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

      // Load rules
      const ruleResult = await pool.query(
        "SELECT * FROM rules WHERE step_id=$1 ORDER BY priority ASC",
        [step.id]
      );

      const rules = ruleResult.rows;

      console.log("Rules for Step:", rules);

      if (rules.length === 0) {
        throw new Error(`No rules defined for step: ${step.name}`);
      }

      let nextStep = null;
      let matched = false;
      let defaultStep = null;

      for (const rule of rules) {

        console.log("Checking Rule:", rule.condition);

        if (rule.condition === "DEFAULT") {
          defaultStep = rule.next_step_id;
          continue;
        }

        let condition = rule.condition;

        Object.keys(data).forEach((key) => {
          const regex = new RegExp(`\\b${key}\\b`, "g");
          condition = condition.replace(regex, data[key]);
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

export const getExecution = async (req, res) => {
  const result = await pool.query("SELECT * FROM executions WHERE id=$1", [
    req.params.id,
  ]);
  res.json(result.rows[0]);
};

export const cancelExecution = async (req, res) => {
  await pool.query("UPDATE executions SET status='canceled' WHERE id=$1", [
    req.params.id,
  ]);
  res.json({ status: "canceled" });
};

export const retryExecution = async (req, res) => {
  await pool.query("UPDATE executions SET retries=retries+1 WHERE id=$1", [
    req.params.id,
  ]);
  res.json({ message: "Retry started" });
};
