import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import aj from "../arcjet.js";
import { createRevision, logAudit } from "../utils/versionUtility.js";

export const createWorkflow = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
  try {
    const { name, input_schema } = req.body;
    const finalSchema = typeof input_schema === 'string' ? input_schema : JSON.stringify(input_schema);
    const id = uuidv4();
    const result = await pool.query(`INSERT INTO workflows (id,name,version,is_active,input_schema,created_at,updated_at) VALUES ($1,$2,1,true,$3,NOW(),NOW())
      RETURNING *`,
      [id, name, finalSchema],
    );
    
    // Audit Log
    await pool.query(
      "INSERT INTO audit_logs (action, target_type, target_id, details) VALUES ($1, $2, $3, $4)",
      ["create", "workflow", id, JSON.stringify({ name })]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

export const getWorkflows = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
  const result = await pool.query("SELECT * FROM workflows ORDER BY created_at DESC",);
  res.json(result.rows);
};

export const getWorkflowById = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
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


export const updateWorkflow = async (req, res) => {
  const decision = await aj.protect(req);
  if (decision.isDenied()) {
    return res.json({
      message: "Request blocked by Arcjet",
    });
  }
  const { id } = req.params;
  const { name, input_schema } = req.body;
  const finalSchema = typeof input_schema === 'string' ? input_schema : JSON.stringify(input_schema);

  try {
    // Take snapshot and increment version BEFORE applying new metadata
    const nextSequentialVersion = await createRevision(id);

    const result = await pool.query(
      `UPDATE workflows SET name=$1, input_schema=$2, updated_at=NOW() WHERE id=$3
       RETURNING *`,
      [name, finalSchema, id]
    );

    // Audit Log
    await logAudit("update", "workflow", id, { version: nextSequentialVersion, name });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

export const getWorkflowVersions = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM workflow_versions WHERE workflow_id=$1 ORDER BY version DESC",
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

export const rollbackWorkflow = async (req, res) => {
  const { id, version } = req.params;
  try {
    // 1. Fetch version snapshot
    const verRes = await pool.query(
      "SELECT * FROM workflow_versions WHERE workflow_id=$1 AND version=$2",
      [id, version]
    );
    if (verRes.rows.length === 0) return res.status(404).json({ message: "Version not found" });
    const snapshot = verRes.rows[0];

    // 2. Start transaction for rollback
    await pool.query("BEGIN");

    // 3. Clear current rules and steps
    await pool.query("DELETE FROM rules WHERE step_id IN (SELECT id FROM steps WHERE workflow_id=$1)", [id]);
    await pool.query("DELETE FROM steps WHERE workflow_id=$1", [id]);

    // 4. Restore steps
    const steps = typeof snapshot.steps === 'string' ? JSON.parse(snapshot.steps) : snapshot.steps;
     for (const step of steps) {
      const stepMetadata = typeof step.metadata === 'string' ? step.metadata : JSON.stringify(step.metadata);
      await pool.query(
        `INSERT INTO steps (id, workflow_id, name, step_type, "order", metadata, approver_email, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [step.id, step.workflow_id, step.name, step.step_type, step.order, stepMetadata, step.approver_email, step.created_at, step.updated_at]
      );
    }

    // 5. Restore rules
    const rules = typeof snapshot.rules === 'string' ? JSON.parse(snapshot.rules) : snapshot.rules;
    for (const rule of rules) {
      await pool.query(
        `INSERT INTO rules (id, step_id, condition, next_step_id, priority, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [rule.id, rule.step_id, rule.condition, rule.next_step_id, rule.priority, rule.created_at, rule.updated_at]
      );
    }

    // 6. Update workflow record (Set version to the activated one)
    const rollbackSchema = typeof snapshot.input_schema === 'string' ? snapshot.input_schema : JSON.stringify(snapshot.input_schema);
    await pool.query(
      "UPDATE workflows SET name=$1, input_schema=$2, version=$3, start_step_id=$4, updated_at=NOW() WHERE id=$5",
      [snapshot.name, rollbackSchema, snapshot.version, snapshot.start_step_id, id]
    );

    await pool.query("COMMIT");

    // Audit Log
    await pool.query(
      "INSERT INTO audit_logs (action, target_type, target_id, details) VALUES ($1, $2, $3, $4)",
      ["activate_version", "workflow", id, JSON.stringify({ activatedVersion: snapshot.version })]
    );

    res.json({ message: `Version ${snapshot.version} activated successfully`, newVersion: snapshot.version });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Rollback Error:", err);
    res.status(500).json({ message: "Rollback failed", error: err.message });
  }
};

export const deleteWorkflow = async (req, res) => {
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
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

    // Audit Log
    await pool.query(
      "INSERT INTO audit_logs (action, target_type, target_id) VALUES ($1, $2, $3)",
      ["delete", "workflow", id]
    );

    res.json({ message: "Workflow and all its components deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Failed to delete workflow", error: err.message });
  }
};
