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
  const workflowResult = await pool.query("SELECT * FROM workflows WHERE id=$1", [id]);
  const workflow = workflowResult.rows[0];
  const steps = await pool.query("SELECT * FROM steps WHERE workflow_id=$1 ORDER BY \"order\" ASC", [id]);
  
  if (workflow && !workflow.start_step_id && steps.rows.length > 0) {
      workflow.start_step_id = steps.rows[0].id;
  }

  const rules = await pool.query(`SELECT r.* FROM rules r JOIN steps s ON r.step_id=s.id WHERE s.workflow_id=$1`,[id],);
  res.json({
    workflow: workflow,
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

export const deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Start deletion from the bottom up (Rules -> Steps -> Workflow)
    
    // 1. Delete all rules associated with any steps of this workflow
    await pool.query(
      "DELETE FROM rules WHERE step_id IN (SELECT id FROM steps WHERE workflow_id = $1)",
      [id]
    );

    // 2. Delete all steps associated with this workflow
    await pool.query("DELETE FROM steps WHERE workflow_id = $1", [id]);

    // 3. Delete any executions (to avoid foreign key issues)
    await pool.query("DELETE FROM executions WHERE workflow_id = $1", [id]);

    // 4. Finally, delete the workflow
    await pool.query("DELETE FROM workflows WHERE id = $1", [id]);

    res.json({ message: "Workflow and all its components deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Failed to delete workflow", error: err.message });
  }
};
