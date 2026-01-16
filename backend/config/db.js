const mysql = require("mysql2/promise");

let pool;

/*************************************************
 * RAILWAY MYSQL (PRODUCTION)
 *************************************************/
if (
  process.env.MYSQLHOST &&
  process.env.MYSQLUSER &&
  process.env.MYSQLDATABASE
) {
  console.log("🚄 Using Railway MySQL");

  pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD || "",
    database: process.env.MYSQLDATABASE,
    port: Number(process.env.MYSQLPORT || 3306),

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: "utf8mb4",

    connectTimeout: 20000, // ✅ VERY IMPORTANT

    ssl: {
      rejectUnauthorized: false, // ✅ Railway safe
    },
  });
}

/*************************************************
 * LOCAL MYSQL (DEVELOPMENT)
 *************************************************/
else {
  console.log("💻 Using Local MySQL");

  pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "test",
    port: Number(process.env.DB_PORT || 3306),

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: "utf8mb4",
    connectTimeout: 20000,
  });
}

/*************************************************
 * SAFE VERIFY (NO CRASH)
 *************************************************/
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    // ❌ DO NOT EXIT — Railway will kill container
  }
})();

module.exports = pool;
