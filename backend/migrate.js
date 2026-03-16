import pool from "./db.js";

async function migrate() {
  try {
    console.log("Adding approver_email column to steps table...");
    await pool.query("ALTER TABLE steps ADD COLUMN IF NOT EXISTS approver_email VARCHAR(255)");
    console.log("Column added successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
