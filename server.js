// ================================
// IMPORTS
// ================================
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

// ================================
// APP
// ================================
const app = express();
const PORT = process.env.PORT || 8080;

// ================================
// CONFIG (FIXED)
// ================================
const ADMIN_API_KEY = "JD_ADMIN_2026"; // 🔑 MUST MATCH FRONTEND

// ================================
// MIDDLEWARE
// ================================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-api-key", "x-user-id"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================
// UPLOADS
// ================================
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use("/uploads", express.static(UPLOAD_DIR));

// ================================
// MULTER
// ================================
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// ================================
// DATABASE
// ================================
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10
});

// ================================
// DB CHECK
// ================================
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL Connected");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
  }
})();

// ================================
// AUTH
// ================================
const adminAuth = (req, res, next) => {
  if (req.headers["x-api-key"] !== ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized admin" });
  }
  next();
};

// ================================
// ROOT
// ================================
app.get("/", (_, res) => {
  res.send("JD Infotech Backend Running 🚀");
});

// ================================
// PRODUCTS (FIXED + SAFE)
// ================================
app.get("/api/products", async (_, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, price, image, description FROM products ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ LOAD PRODUCTS ERROR:", err.message);
    res.status(500).json([]);
  }
});

app.post(
  "/api/products",
  adminAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, price, description } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : "";

      await pool.query(
        "INSERT INTO products (name, price, image, description) VALUES (?,?,?,?)",
        [name, price, image, description || ""]
      );

      res.json({ success: true });
    } catch (err) {
      console.error("❌ ADD PRODUCT ERROR:", err.message);
      res.status(500).json({ error: "Add failed" });
    }
  }
);

app.delete("/api/products/:id", adminAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE PRODUCT ERROR:", err.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ================================
// START
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
