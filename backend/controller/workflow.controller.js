import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

export const createWorkflow = async (req, res) => 
{
  try {
    const { name, input_schema } = req.body;
    const id = uuidv4();
    const result = await pool.query(`INSERT INTO workflows (id,name,version,is_active,input_schema,created_at,updated_at) VALUES ($1,$2,1,true,$3,NOW(),NOW())
      RETURNING *`,
      [id, name, input_schema],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

export const getWorkflows = async (req, res) => 
{
  const result = await pool.query("SELECT * FROM workflows ORDER BY created_at DESC",);
  res.json(result.rows);
};

export const getWorkflowById = async (req, res) => 
{
  const { id } = req.params;
  const workflow = await pool.query("SELECT * FROM workflows WHERE id=$1", [id]);
  const steps = await pool.query("SELECT * FROM steps WHERE workflow_id=$1", [id]);
  const rules = await pool.query(`SELECT r.* FROM rules r JOIN steps s ON r.step_id=s.id WHERE s.workflow_id=$1`,[id],);
  res.json({
    workflow: workflow.rows[0],
    steps: steps.rows,
    rules: rules.rows,
  });
};

export const updateWorkflow = async (req, res) => 
{
  const { id } = req.params;
  const { name, input_schema } = req.body;
  const old = await pool.query("SELECT version FROM workflows WHERE id=$1", [id]);
  const version = old.rows[0].version + 1;
  const result = await pool.query(`UPDATE workflows SET name=$1,input_schema=$2,version=$3,updated_at=NOW() WHERE id=$4
    RETURNING *`,[name, input_schema, version, id],);
  res.json(result.rows[0]);
};

export const deleteWorkflow = async (req, res) => 
{
  const { id } = req.params;
  await pool.query("DELETE FROM workflows WHERE id=$1", [id]);
  res.json({ message: "Workflow deleted" });
};
