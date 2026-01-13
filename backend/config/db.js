const mysql = require("mysql2");

let pool;

if (
  process.env.MYSQLHOST &&
  process.env.MYSQLUSER &&
  process.env.MYSQLPASSWORD &&
  process.env.MYSQLDATABASE
) {
  pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    ssl: {
      rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10
  });

  pool.getConnection((err, conn) => {
    if (err) {
      console.error("❌ MySQL connection failed:", err.message);
    } else {
      console.log("✅ MySQL connected to AIVEN");
      conn.release();
    }
  });
} else {
  console.warn("⚠️ MySQL env vars not found");
}

module.exports = pool ? pool.promise() : null;
