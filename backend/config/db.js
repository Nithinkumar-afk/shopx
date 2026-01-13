const mysql = require("mysql2/promise");

/**
 * ================= MYSQL CONNECTION POOL =================
 * Works for:
 * ✅ Local XAMPP
 * ✅ Railway Production
 */

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/* ================= SAFE CONNECTION TEST ================= */
(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection error:");
    console.error(err.message);

    // ❗ DO NOT EXIT IN PRODUCTION (Railway)
    // process.exit(1);
  }
})();

module.exports = db;
