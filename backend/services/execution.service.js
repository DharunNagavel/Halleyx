import pool from "../db.js";
import { evaluateRules } from "./ruleEngine.js";

export const runWorkflow = async ({ workflow_id, start_step_id, data }) => 
{
  let currentStepId = start_step_id;
  let logs = [];
  let status = "completed";
  try {
    while (currentStepId) 
    {
      const stepResult = await pool.query("SELECT * FROM steps WHERE id=$1",[currentStepId]);
      if (stepResult.rows.length === 0) 
      {
        throw new Error("Step not found");
      }
      const step = stepResult.rows[0];
      const stepLog = {
        step_name: step.name,
        step_type: step.step_type,
        selected_next_step: null,
        status: "completed",
        started_at: new Date(),
        ended_at: null
      };
      console.log("Executing step:", step.name);
      if (step.step_type === "approval") {
        stepLog.status = "waiting_for_approval";
        logs.push(stepLog);
        return {
          status: "waiting",
          logs,
          current_step_id: step.id
        };
      }
      const ruleResult = await pool.query("SELECT * FROM rules WHERE step_id=$1 ORDER BY priority ASC",[step.id]);
      const rules = ruleResult.rows;
      const nextStep = evaluateRules(rules, data);
      stepLog.selected_next_step = nextStep;
      stepLog.ended_at = new Date();
      logs.push(stepLog);
      currentStepId = nextStep;
    }
  } catch (error) {
    status = "failed";
    logs.push({
      error: error.message,
      status: "failed"
    });
  }
  return {
    status,
    logs,
    current_step_id: null
  };
};