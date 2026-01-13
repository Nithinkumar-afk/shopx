const mysql = require("mysql2/promise");

// Helper to safely read env vars
const env = (keyList) => {
  for (const key of keyList) {
    if (process.env[key]) return process.env[key];
  }
  return null;
};

// Detect Railway / MySQL variables automatically
const DB_CONFIG = {
  host: env(["MYSQLHOST", "MYSQL_HOST", "RAILWAY_MYSQL_HOST", "DB_HOST"]),
  port: env(["MYSQLPORT", "MYSQL_PORT", "RAILWAY_MYSQL_PORT", "DB_PORT"]),
  user: env(["MYSQLUSER", "MYSQL_USER", "RAILWAY_MYSQL_USER", "DB_USER"]),
  password: env([
    "MYSQLPASSWORD",
    "MYSQL_PASSWORD",
    "RAILWAY_MYSQL_PASSWORD",
    "DB_PASSWORD",
  ]),
  database: env([
    "MYSQLDATABASE",
    "MYSQL_DATABASE",
    "RAILWAY_MYSQL_DATABASE",
    "DB_NAME",
  ]),
};

// Validate
for (const [key, value] of Object.entries(DB_CONFIG)) {
  if (!value) {
    console.error(`❌ Missing database config: ${key}`);
    process.exit(1);
  }
}

// Create pool
const pool = mysql.createPool({
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false, // REQUIRED for Railway
  },
});

// Test connection
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Railway MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1);
  }
})();

module.exports = pool;
