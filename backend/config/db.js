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

    /* ✅ REQUIRED FOR RAILWAY */
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

/*************************************************
 * LOCAL MYSQL (DEVELOPMENT)
 *************************************************/
else {
  console.log("💻 Using Local MySQL");

  if (!process.env.DB_NAME) {
    console.error("❌ DB_NAME missing in environment");
    process.exit(1);
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: "utf8mb4",
  });
}

/*************************************************
 * VERIFY CONNECTION (FAIL FAST)
 *************************************************/
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1); // 🚨 Railway must crash if DB fails
  }
})();

module.exports = pool;
