import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import aj from "../arcjet.js";

export const createStep = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
  const { workflow_id } = req.params;
  const { name, step_type, order, metadata, approver_email } = req.body;
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO steps (id,workflow_id,name,step_type,"order",metadata,approver_email,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
     RETURNING *`,[id, workflow_id, name, step_type, order, metadata, approver_email],);

  // Auto-set start_step_id if workflow doesn't have one
  const wf = await pool.query("SELECT start_step_id FROM workflows WHERE id=$1", [workflow_id]);
  if (wf.rows.length > 0 && !wf.rows[0].start_step_id) {
      await pool.query("UPDATE workflows SET start_step_id=$1 WHERE id=$2", [id, workflow_id]);
  }

  res.json(result.rows[0]);
};

export const getSteps = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
  const { workflow_id } = req.params;
  const result = await pool.query(`SELECT * FROM steps WHERE workflow_id=$1 ORDER BY "order"`,[workflow_id],);
  res.json(result.rows);
};

export const updateStep = async (req, res) => {
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
  try {
    const { id } = req.params;
    const { name, step_type, order, metadata, approver_email } = req.body;
    const result = await pool.query(
      `UPDATE steps SET name=$1, step_type=$2, "order"=$3, metadata=$4, approver_email=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
      [name, step_type, order, metadata || {}, approver_email, id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to update step", error: err.message });
  }
};

export const deleteStep = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
  const { id } = req.params;
  await pool.query("DELETE FROM steps WHERE id=$1", [id]);
  res.json({ message: "Step deleted" });
};
