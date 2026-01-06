import fs from "fs";
import pool from "./config/database.js";

export async function initDB() {
  try {
    const sql = fs.readFileSync("./database/schema.sql", "utf8");
    await pool.query(sql);
    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ DB init failed:", err.message);
  }
}
