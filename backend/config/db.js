const mysql = require("mysql2");

// Railway provides MYSQL_URL automatically
if (!process.env.MYSQL_URL) {
  console.error("❌ MYSQL_URL is not defined");
  process.exit(1);
}

const pool = mysql.createPool({
  uri: process.env.MYSQL_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection (safe on Railway)
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
    return;
  }
  console.log("✅ MySQL connected");
  conn.release();
});

module.exports = pool.promise();
