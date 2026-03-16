import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import aj from "../arcjet.js";

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
  const id = uuidv4();
  const result = await pool.query(`INSERT INTO rules (id,step_id,condition,next_step_id,priority,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
  RETURNING *`,[id, step_id, condition, next_step_id, priority],);
  res.json(result.rows[0]);
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
  const { id } = req.params;
  const { condition, next_step_id, priority } = req.body;
  const result = await pool.query(`UPDATE rules SET condition=$1,next_step_id=$2,priority=$3 WHERE id=$4 RETURNING *`,
  [condition, next_step_id, priority, id],);
  res.json(result.rows[0]);
};

export const deleteRule = async (req, res) => 
{
  const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
  const { id } = req.params;
  await pool.query("DELETE FROM rules WHERE id=$1", [id]);
  res.json({ message: "Rule deleted" });
};
