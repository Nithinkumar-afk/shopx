const mysql = require("mysql2/promise");

let pool;

/*************************************************
 * RAILWAY MYSQL (AUTO DETECT)
 *************************************************/
if (
  process.env.MYSQLHOST &&
  process.env.MYSQLUSER &&
  process.env.MYSQLDATABASE
) {
  console.log("🚄 Using Railway MySQL ENV");

  pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD || "",
    database: process.env.MYSQLDATABASE,
    port: Number(process.env.MYSQLPORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
  });
}

/*************************************************
 * MYSQL_URL SUPPORT
 *************************************************/
else if (process.env.MYSQL_URL) {
  console.log("🔗 Using MYSQL_URL");

  pool = mysql.createPool({
    uri: process.env.MYSQL_URL,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

/*************************************************
 * LOCALHOST FALLBACK
 *************************************************/
else {
  console.log("💻 Using Local MySQL");

  pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
  });
}

/*************************************************
 * VERIFY CONNECTION (NON-BLOCKING)
 *************************************************/
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ MySQL connected successfully");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err.message);
  });

module.exports = pool;
