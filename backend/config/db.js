const mysql = require("mysql2/promise");

/*************************************************
 * NORMALIZE RAILWAY MYSQL ENV
 *************************************************/
const MYSQL_HOST = process.env.MYSQLHOST || process.env.MYSQL_HOST;
const MYSQL_USER = process.env.MYSQLUSER || process.env.MYSQL_USER;
const MYSQL_PASSWORD =
  process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "";
const MYSQL_DATABASE =
  process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE;
const MYSQL_PORT = Number(
  process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306
);

/*************************************************
 * SAFE ENV DEBUG (NO SECRETS)
 *************************************************/
console.log("🔎 DB ENV CHECK:", {
  MYSQL_HOST: Boolean(MYSQL_HOST),
  MYSQL_USER: Boolean(MYSQL_USER),
  MYSQL_DATABASE: Boolean(MYSQL_DATABASE),
  MYSQL_PORT,
});

/*************************************************
 * RETURN NULL POOL IF ENV MISSING (SAFE)
 *************************************************/
if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
  console.error("❌ MySQL env missing — DB disabled");
  module.exports = null;
  return;
}

/*************************************************
 * CREATE POOL
 *************************************************/
const pool = mysql.createPool({
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  port: MYSQL_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/*************************************************
 * VERIFY CONNECTION (NON-FATAL)
 *************************************************/
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    // App continues — routes still work
  }
})();

module.exports = pool;
