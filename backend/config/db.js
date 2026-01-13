const mysql = require("mysql2");

// Railway provides MYSQL_URL automatically
const pool = mysql.createPool(process.env.MYSQL_URL);

// Test connection (Railway safe)
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
    return;
  }
  console.log("✅ MySQL connected");
  conn.release();
});

module.exports = pool.promise();
