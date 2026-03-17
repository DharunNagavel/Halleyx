import pool from "../db.js";

export const getAdminStats = async (req, res) => {
  try {
    const workflowCount = await pool.query("SELECT COUNT(*) FROM workflows");
    const executionStats = await pool.query("SELECT status, COUNT(*) FROM executions GROUP BY status");
    const recentLogs = await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10");
    const executionsOverTime = await pool.query(`
      SELECT DATE_TRUNC('day', started_at) as day, COUNT(*) 
      FROM executions 
      WHERE started_at > NOW() - INTERVAL '7 days'
      GROUP BY day 
      ORDER BY day ASC
    `);

    res.json({
      totalWorkflows: parseInt(workflowCount.rows[0].count),
      executionStats: executionStats.rows,
      recentLogs: recentLogs.rows,
      executionsOverTime: executionsOverTime.rows
    });
  } catch (err) {
    console.error("Admin Stats Error:", err);
    res.status(500).json({ message: "Failed to fetch admin stats", error: err.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err.message);
  }
};
