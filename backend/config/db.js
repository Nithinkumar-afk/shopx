const mysql = require("mysql2");

let pool = null;

if (
  process.env.MYSQLHOST &&
  process.env.MYSQLUSER &&
  process.env.MYSQLPASSWORD &&
  process.env.MYSQLDATABASE
) {
  pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT || 3306),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    waitForConnections: true,
    connectionLimit: 10
  });

  pool.getConnection((err, conn) => {
    if (err) {
      console.error("⚠️ MySQL connection failed:", err.message);
    } else {
      console.log("✅ MySQL connected");
      conn.release();
    }
  });
} else {
  console.warn("⚠️ MySQL env vars not found. App running without DB.");
}

module.exports = pool ? pool.promise() : null;
