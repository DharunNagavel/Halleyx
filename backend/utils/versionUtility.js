import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a snapshot of the current workflow state (workflow info, steps, rules)
 * and increments the workflow's version.
 * @param {string} workflowId 
 */
export const createRevision = async (workflowId) => {
  try {
    // 1. Get current workflow state
    const wfRes = await pool.query("SELECT * FROM workflows WHERE id=$1", [workflowId]);
    if (wfRes.rows.length === 0) throw new Error("Workflow not found");
    const workflow = wfRes.rows[0];

    const stepRes = await pool.query("SELECT * FROM steps WHERE workflow_id=$1", [workflowId]);
    const ruleRes = await pool.query(
      `SELECT r.* FROM rules r 
       JOIN steps s ON r.step_id = s.id 
       WHERE s.workflow_id = $1`, [workflowId]);

    // 2. Save current state to workflow_versions
    const versionId = uuidv4();
    const snapSchema = typeof workflow.input_schema === 'string' ? workflow.input_schema : JSON.stringify(workflow.input_schema);
    
    await pool.query(
      `INSERT INTO workflow_versions (id, workflow_id, version, name, input_schema, steps, rules, start_step_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        versionId, 
        workflowId, 
        workflow.version, 
        workflow.name, 
        snapSchema, 
        JSON.stringify(stepRes.rows), 
        JSON.stringify(ruleRes.rows), 
        workflow.start_step_id
      ]
    );

    // 3. Determine NEXT version number
    const maxVerRes = await pool.query("SELECT MAX(version) as max_v FROM workflow_versions WHERE workflow_id=$1", [workflowId]);
    const nextVer = Math.max(maxVerRes.rows[0].max_v || 0, workflow.version) + 1;

    // 4. Update core workflow version
    await pool.query("UPDATE workflows SET version=$1, updated_at=NOW() WHERE id=$2", [nextVer, workflowId]);

    return nextVer;
  } catch (err) {
    console.error("Revision Error:", err);
    throw err;
  }
};

/**
 * Log an action to audit logs
 */
export const logAudit = async (action, type, id, details = {}) => {
  try {
    await pool.query(
      "INSERT INTO audit_logs (action, target_type, target_id, details, created_at) VALUES ($1, $2, $3, $4, NOW())",
      [action, type, id, JSON.stringify(details)]
    );
  } catch (err) {
    console.error("Audit Log Error:", err);
  }
};
