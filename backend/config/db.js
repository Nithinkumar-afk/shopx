const mysql = require("mysql2/promise");

/* ================= ENV READ (LOCAL + RAILWAY) ================= */
const DB_HOST =
  process.env.DB_HOST || process.env.MYSQLHOST;

const DB_USER =
  process.env.DB_USER || process.env.MYSQLUSER;

const DB_PASSWORD =
  process.env.DB_PASSWORD || process.env.MYSQLPASSWORD;

const DB_NAME =
  process.env.DB_NAME || process.env.MYSQLDATABASE;

const DB_PORT =
  process.env.DB_PORT || process.env.MYSQLPORT || 3306;

/* ================= VALIDATION ================= */
if (!DB_HOST || !DB_USER || !DB_NAME) {
  console.warn("⚠️ MySQL env vars missing. Skipping DB connection.");
  console.warn("🔎 FOUND:", {
    DB_HOST,
    DB_USER,
    DB_NAME,
    DB_PORT,
  });
  module.exports = null;
  return;
}

/* ================= CREATE POOL ================= */
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* ================= TEST CONNECTION ONCE ================= */
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    console.error("🔎 CHECK:", {
      host: DB_HOST,
      user: DB_USER,
      db: DB_NAME,
      port: DB_PORT,
    });
  }
})();

/* ================= EXPORT POOL ================= */
module.exports = pool;
