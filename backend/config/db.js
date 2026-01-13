const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3307,   // 🔴 REQUIRED FIX
  user: process.env.DB_USER || "nithin",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "shopx",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/* 🔥 PRODUCTION-SAFE CONNECTION TEST */
(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ MySQL connected on port", process.env.DB_PORT || 3307);
    conn.release();
  } catch (err) {
    console.error("❌ MySQL CONNECTION FAILED");
    console.error(err.code, err.message);
    process.exit(1);
  }
})();

module.exports = db;
