const mysql = require("mysql2");

// Validate required env vars
const required = [
  "MYSQLHOST",
  "MYSQLPORT",
  "MYSQLUSER",
  "MYSQLPASSWORD",
  "MYSQLDATABASE"
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
}

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
    return;
  }
  console.log("✅ MySQL connected");
  conn.release();
});

module.exports = pool.promise();
