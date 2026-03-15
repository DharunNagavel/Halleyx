import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import { runWorkflow } from "../services/execution.service.js";

export const executeWorkflow = async (req, res) => {
  const { workflow_id } = req.params;
  const data = req.body;
  const workflow = await pool.query("SELECT * FROM workflows WHERE id=$1", [workflow_id,]);
  const startStep = workflow.rows[0].start_step_id;
  const executionId = uuidv4();
  const logs = await runWorkflow({current_step_id: startStep,data});
  await pool.query(`INSERT INTO executions (id,workflow_id,workflow_version,status,data,logs,current_step_id,retries,started_at) VALUES($1,$2,$3,'completed',$4,$5,$6,0,NOW())`,
    [
      executionId,
      workflow_id,
      workflow.rows[0].version,
      data,
      JSON.stringify(logs),
      null,
    ]);

  res.json(
    {
        execution_id: executionId,
        logs
    });
};

export const getExecution = async (req, res) => 
{
  const result = await pool.query("SELECT * FROM executions WHERE id=$1", [req.params.id,]);
  res.json(result.rows[0]);
};

export const cancelExecution = async (req, res) => 
{
  await pool.query("UPDATE executions SET status='canceled' WHERE id=$1", [req.params.id,]);
  res.json({ status: "canceled" });
};

export const retryExecution = async (req, res) => 
{
  await pool.query("UPDATE executions SET retries=retries+1 WHERE id=$1", [req.params.id,]);
  res.json({ message: "Retry started" });
};