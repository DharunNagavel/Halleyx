import pool from "../db.js";
import client from "../redis.js";

export const getAdminStats = async (req, res) => {
  try {
    const cacheKey = "admin:stats";
    
    // Attempt to get from Redis cache
    try {
      const cachedStats = await client.get(cacheKey);
      if (cachedStats) {
        return res.json(JSON.parse(cachedStats));
      }
    } catch (redisErr) {
      console.error("Redis Get Error:", redisErr);
    }

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

    const stats = {
      totalWorkflows: parseInt(workflowCount.rows[0].count),
      executionStats: executionStats.rows,
      recentLogs: recentLogs.rows,
      executionsOverTime: executionsOverTime.rows
    };

    // Store in Redis cache with 5 minute expiration (300 seconds)
    try {
      await client.setEx(cacheKey, 300, JSON.stringify(stats));
    } catch (redisErr) {
      console.error("Redis Set Error:", redisErr);
    }

    res.json(stats);
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
