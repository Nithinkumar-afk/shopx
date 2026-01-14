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
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_DATABASE,
  MYSQL_PORT,
});

/*************************************************
 * DO NOT KILL CONTAINER (Railway rule)
 *************************************************/
if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
  console.error("❌ MySQL env vars missing — DB disabled");
  module.exports = null;
  return;
}

/*************************************************
 * CREATE MYSQL POOL (SSL REQUIRED)
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

  // 🔐 REQUIRED FOR RAILWAY / AIVEN
  ssl: {
    rejectUnauthorized: false,
  },
});

/*************************************************
 * VERIFY CONNECTION (NON-FATAL)
 *************************************************/
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully (SSL)");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
  }
})();

module.exports = pool;
