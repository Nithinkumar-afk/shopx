const mysql = require("mysql2");

// ✅ Read env vars ONCE
const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_PORT,
} = process.env;

// 🔎 Debug (VERY IMPORTANT)
console.log("🔎 ENV CHECK:", {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_DATABASE,
  MYSQL_PORT,
});

// ❌ Stop app if env vars missing
if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
  console.error("⚠️ MySQL env vars missing. App running without DB.");
  module.exports = null;
  return;
}

// ✅ Create pool
const pool = mysql.createPool({
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  port: MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
  } else {
    console.log("✅ MySQL connected successfully");
    connection.release();
  }
});

module.exports = pool;
