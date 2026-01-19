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
// MIDDLEWARE
// ================================
app.use(cors({ origin: "*" }));
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
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) =>
      cb(null, Date.now() + "-" + file.originalname)
  }),
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  }
});

// ================================
// DATABASE (RAILWAY SAFE)
// ================================
const pool = mysql.createPool(
  process.env.DATABASE_URL
    ? process.env.DATABASE_URL
    : {
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE || "railway",
        port: process.env.MYSQLPORT,
        waitForConnections: true,
        connectionLimit: 10
      }
);

// ================================
// DB TEST
// ================================
(async () => {
  try {
    const conn = await pool.getConnection();
    const [[r]] = await conn.query("SELECT DATABASE() AS db");
    console.log("✅ MySQL Connected");
    console.log("📦 Using DB:", r.db);
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
  }
})();

// ================================
// HELPERS
// ================================
const getUserId = req => Number(req.headers["x-user-id"]) || null;

const adminAuth = (req, res, next) => {
  if (req.headers["x-api-key"] !== process.env.ADMIN_API_KEY) {
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
// DB DEBUG (REMOVE LATER)
// ================================
app.get("/__dbtest", async (_, res) => {
  const [tables] = await pool.query("SHOW TABLES");
  res.json(tables);
});

// ================================
// USER INIT
// ================================
app.post("/api/user/init", async (_, res) => {
  try {
    const [r] = await pool.query(
      "INSERT INTO users (name) VALUES ('Guest User')"
    );
    res.json({ userId: r.insertId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// PRODUCTS
// ================================
app.get("/api/products", async (_, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ products:", err.message);
    res.status(500).json({ error: err.message });
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
      console.error(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

app.delete("/api/products/:id", adminAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// ORDERS
// ================================
app.post("/api/orders", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.sendStatus(401);

    const { items, total_amount } = req.body;
    if (!items?.length)
      return res.status(400).json({ error: "No items" });

    const [[u]] = await pool.query(
      `SELECT u.name, u.phone, a.address_line
       FROM users u
       LEFT JOIN addresses a ON u.id=a.user_id
       WHERE u.id=?`,
      [userId]
    );

    if (!u?.name || !u?.phone || !u?.address_line) {
      return res.status(400).json({ error: "Complete profile" });
    }

    const [order] = await pool.query(
      `INSERT INTO orders
       (user_id, customer_name, total_amount, status, created_at)
       VALUES (?,?,?,?,NOW())`,
      [userId, u.name, total_amount, "PLACED"]
    );

    for (const i of items) {
      await pool.query(
        `INSERT INTO order_items
         (order_id, name, quantity, price)
         VALUES (?,?,?,?)`,
        [order.insertId, i.name, i.qty, i.price]
      );
    }

    res.json({ success: true, orderId: order.insertId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// ADMIN
// ================================
app.get("/api/admin/orders", adminAuth, async (_, res) => {
  try {
    const [orders] = await pool.query(
      "SELECT * FROM orders ORDER BY id DESC"
    );

    const ids = orders.map(o => o.id);
    if (!ids.length) return res.json([]);

    const [items] = await pool.query(
      "SELECT * FROM order_items WHERE order_id IN (?)",
      [ids]
    );

    const map = {};
    items.forEach(i => {
      if (!map[i.order_id]) map[i.order_id] = [];
      map[i.order_id].push(i);
    });

    orders.forEach(o => (o.items = map[o.id] || []));
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
