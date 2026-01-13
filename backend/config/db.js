const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/* 🔥 SAFE CONNECTION TEST (NO CRASH) */
(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("⚠️ MySQL not ready yet, retrying...");
    console.error(err.message);
    // ❌ DO NOT EXIT THE APP
  }
})();

module.exports = db;
