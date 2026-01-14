const mysql = require("mysql2/promise");

/*************************************************
 * NORMALIZE RAILWAY + LOCAL MYSQL ENV
 *************************************************/
const MYSQL_HOST =
  process.env.MYSQLHOST ||
  process.env.MYSQL_HOST ||
  "127.0.0.1";

const MYSQL_USER =
  process.env.MYSQLUSER ||
  process.env.MYSQL_USER ||
  "root";

const MYSQL_PASSWORD =
  process.env.MYSQLPASSWORD ||
  process.env.MYSQL_PASSWORD ||
  "";

const MYSQL_DATABASE =
  process.env.MYSQLDATABASE ||
  process.env.MYSQL_DATABASE;

const MYSQL_PORT = parseInt(
  process.env.MYSQLPORT ||
  process.env.MYSQL_PORT ||
  "3306",
  10
);

/*************************************************
 * SAFE ENV DEBUG
 *************************************************/
console.log("🔎 DB ENV CHECK:", {
  MYSQL_HOST,
  MYSQL_USER: Boolean(MYSQL_USER),
  MYSQL_DATABASE,
  MYSQL_PORT,
});

/*************************************************
 * ENV VALIDATION
 *************************************************/
if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
  console.error("❌ MySQL env missing — DB disabled");
  module.exports = null;
  return;
}

/*************************************************
 * CREATE CONNECTION POOL
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
 * VERIFY CONNECTION
 *************************************************/
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
  }
})();

module.exports = pool;
