const mysql = require("mysql2/promise");

/*************************************************
 * RAILWAY FIRST (MYSQL_URL)
 *************************************************/
let pool;

if (process.env.MYSQL_URL) {
  // ✅ Railway / Production
  console.log("🚄 Using Railway MYSQL_URL");

  pool = mysql.createPool({
    uri: process.env.MYSQL_URL,
    waitForConnections: true,
    connectionLimit: 10,
  });

} else {
  // ✅ Localhost fallback
  console.log("💻 Using Local MySQL");

  const {
    DB_HOST = "127.0.0.1",
    DB_USER = "root",
    DB_PASSWORD = "",
    DB_NAME,
    DB_PORT = 3306,
  } = process.env;

  if (!DB_NAME) {
    console.error("❌ Local DB_NAME missing");
    process.exit(1);
  }

  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: Number(DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
  });
}

/*************************************************
 * VERIFY CONNECTION
 *************************************************/
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
  }
})();

module.exports = pool;
