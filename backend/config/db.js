const mysql = require("mysql2");

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
 * DEBUG (ONE TIME ONLY)
 *************************************************/
console.log("🔎 DB ENV CHECK:", {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_DATABASE,
  MYSQL_PORT,
});

/*************************************************
 * HARD FAIL IF DB CONFIG MISSING
 *************************************************/
if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
  console.error("❌ FATAL: MySQL env vars missing. App cannot start.");
  process.exit(1); // 🔥 REQUIRED FOR RAILWAY
}

/*************************************************
 * CREATE CONNECTION POOL
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
 * VERIFY DB CONNECTION (NON-BLOCKING)
 *************************************************/
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1); // 🔥 FAIL FAST
  }
  console.log("✅ MySQL connected successfully");
  conn.release();
});

module.exports = pool;
