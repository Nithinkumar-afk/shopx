const mysql = require("mysql2");

if (!process.env.MYSQL_URL) {
  console.error("❌ MYSQL_URL not found in environment variables");
  process.exit(1);
}

const pool = mysql.createPool(process.env.MYSQL_URL);

pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
  } else {
    console.log("✅ Railway MySQL connected successfully");
    connection.release();
  }
});

module.exports = pool;
