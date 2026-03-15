import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

export const createStep = async (req, res) => 
{
  const { workflow_id } = req.params;
  const { name, step_type, order, metadata } = req.body;
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO steps (id,workflow_id,name,step_type,"order",metadata,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
     RETURNING *`,[id, workflow_id, name, step_type, order, metadata],);
  res.json(result.rows[0]);
};

export const getSteps = async (req, res) => 
{
  const { workflow_id } = req.params;
  const result = await pool.query(`SELECT * FROM steps WHERE workflow_id=$1 ORDER BY "order"`,[workflow_id],);
  res.json(result.rows);
};

export const updateStep = async (req, res) => 
{
  const { id } = req.params;
  const { name, metadata } = req.body;
  const result = await pool.query(`UPDATE steps SET name=$1,metadata=$2,updated_at=NOW() WHERE id=$3
    RETURNING *`,[name, metadata, id],);
  res.json(result.rows[0]);
};

export const deleteStep = async (req, res) => 
{
  const { id } = req.params;
  await pool.query("DELETE FROM steps WHERE id=$1", [id]);
  res.json({ message: "Step deleted" });
};
