const mysql = require("mysql2/promise");

/*************************************************
 * NORMALIZE RAILWAY MYSQL ENV (CRITICAL)
 *************************************************/
const MYSQL_HOST = process.env.MYSQLHOST || process.env.MYSQL_HOST;
const MYSQL_USER = process.env.MYSQLUSER || process.env.MYSQL_USER;
const MYSQL_PASSWORD =
  process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "";
const MYSQL_DATABASE =
  process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE;
const MYSQL_PORT = process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306;

/*************************************************
 * DEBUG (SAFE — NO SECRETS)
 *************************************************/
console.log("🔎 DB ENV CHECK:", {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_DATABASE,
  MYSQL_PORT,
});

/*************************************************
 * HARD FAIL IF ENV VARS MISSING (CORRECT)
 *************************************************/
if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
  console.error("❌ FATAL: MySQL env vars missing. App cannot start.");
  process.exit(1); // ✅ Correct for Railway
}

/*************************************************
 * CREATE MYSQL POOL (PROMISE API)
 *************************************************/
const pool = mysql.createPool({
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  port: Number(MYSQL_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/*************************************************
 * VERIFY DB CONNECTION (NON-FATAL)
 *************************************************/
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection error:", err.message);
    // ❗ Do NOT exit here — prevents Railway restart loop
  }
})();

module.exports = pool;
