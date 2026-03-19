import pool from "../db.js";
import client from "../redis.js";
import { v4 as uuidv4 } from "uuid";
import aj from "../arcjet.js";
import { createRevision, logAudit } from "../utils/versionUtility.js";

export const createRule = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }

  const { step_id } = req.params;
  const { condition, next_step_id, priority } = req.body;
  
  try {
    // Get workflow_id
    const step = await pool.query("SELECT workflow_id FROM steps WHERE id=$1", [step_id]);
    if (step.rows.length > 0) {
        await createRevision(step.rows[0].workflow_id);
    }

    const id = uuidv4();
    const result = await pool.query(`INSERT INTO rules (id,step_id,condition,next_step_id,priority,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
    RETURNING *`,[id, step_id, condition, next_step_id, priority],);

    // Invalidate caches
    await client.del(`rules:step:${step_id}`);
    if (step.rows.length > 0) {
        await client.del(`workflows:id:${step.rows[0].workflow_id}`);
    }

    await logAudit("create_rule", "rule", id, { condition });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to create rule", error: err.message });
  }
};

export const getRules = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
  const { step_id } = req.params;
  const result = await pool.query(`SELECT * FROM rules WHERE step_id=$1 ORDER BY priority`,[step_id],);
  res.json(result.rows);
};

export const updateRule = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
  try {
    const { id } = req.params;
    const { condition, next_step_id, priority } = req.body;

    // Get workflow_id
    const rule = await pool.query("SELECT s.workflow_id FROM rules r JOIN steps s ON r.step_id=s.id WHERE r.id=$1", [id]);
    if (rule.rows.length > 0) {
        await createRevision(rule.rows[0].workflow_id);
    }

    const result = await pool.query(`UPDATE rules SET condition=$1,next_step_id=$2,priority=$3 WHERE id=$4 RETURNING *`,
    [condition, next_step_id, priority, id],);

    // Invalidate caches
    const ruleData = await pool.query("SELECT step_id FROM rules WHERE id=$1", [id]);
    if (ruleData.rows.length > 0) {
        await client.del(`rules:step:${ruleData.rows[0].step_id}`);
    }
    if (rule.rows.length > 0) {
        await client.del(`workflows:id:${rule.rows[0].workflow_id}`);
    }

    await logAudit("update_rule", "rule", id, { condition });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to update rule", error: err.message });
  }
};

export const deleteRule = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
  try {
    const { id } = req.params;

    // Get workflow_id
    const rule = await pool.query("SELECT s.workflow_id FROM rules r JOIN steps s ON r.step_id=s.id WHERE r.id=$1", [id]);
    if (rule.rows.length > 0) {
        await createRevision(rule.rows[0].workflow_id);
    }

    const ruleToDelete = await pool.query("SELECT step_id FROM rules WHERE id=$1", [id]);
    if (ruleToDelete.rows.length > 0) {
        await client.del(`rules:step:${ruleToDelete.rows[0].step_id}`);
    }
    if (rule.rows.length > 0) {
        await client.del(`workflows:id:${rule.rows[0].workflow_id}`);
    }

    await pool.query("DELETE FROM rules WHERE id=$1", [id]);
    await logAudit("delete_rule", "rule", id);
    res.json({ message: "Rule deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete rule", error: err.message });
  }
};
