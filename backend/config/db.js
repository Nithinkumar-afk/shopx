const mysql = require("mysql2");

// ✅ Read Railway env vars (CORRECT NAMES)
const {
  MYSQLHOST,
  MYSQLUSER,
  MYSQLPASSWORD,
  MYSQL_DATABASE,
  MYSQLPORT,
} = process.env;

// 🔎 Debug
console.log("🔎 ENV CHECK:", {
  MYSQLHOST,
  MYSQLUSER,
  MYSQL_DATABASE,
  MYSQLPORT,
});

// ❌ Stop app if env vars missing
if (!MYSQLHOST || !MYSQLUSER || !MYSQL_DATABASE) {
  console.error("⚠️ MySQL env vars missing. App running without DB.");
  module.exports = null;
  return;
}

// ✅ Create pool
const pool = mysql.createPool({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASSWORD,
  database: MYSQL_DATABASE,
  port: MYSQLPORT || 3306,
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
