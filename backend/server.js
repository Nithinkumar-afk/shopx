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
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "x-user-id", "x-api-key"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================
// UPLOADS (⚠️ Railway storage is TEMPORARY)
// ================================
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use("/uploads", express.static(UPLOAD_DIR));

// ================================
// MULTER (IMAGE UPLOAD)
// ================================
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"));
    }
    cb(null, true);
  },
});

// ================================
// DATABASE (MYSQL POOL - RAILWAY)
// ================================
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ================================
// TEST DB CONNECTION
// ================================
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL Pool Ready");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL Connection Error:", err.message);
  }
})();

// ================================
// HELPERS
// ================================
function getUserId(req) {
  const id = req.headers["x-user-id"];
  return id ? Number(id) : null;
}

// ================================
// ADMIN AUTH
// ================================
function adminAuth(req, res, next) {
  if (req.headers["x-api-key"] !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized admin" });
  }
  next();
}

// ================================
// ROOT
// ================================
app.get("/", (_, res) => {
  res.send("JD Infotech Backend Running 🚀");
});

// ================================
// USER INIT (GUEST USER)
// ================================
app.post("/api/user/init", async (_, res) => {
  try {
    const [result] = await pool.query(
      "INSERT INTO users (name) VALUES (?)",
      ["Guest User"]
    );
    res.json({ userId: result.insertId });
  } catch (err) {
    console.error("USER INIT ERROR:", err.message);
    res.status(500).json({ error: "User init failed" });
  }
});

// ================================
// PRODUCTS
// ================================
app.get("/api/products", async (_, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error("PRODUCT API ERROR:", err.message);
    res.status(500).json({ error: "Failed to load products" });
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
      console.error("ADD PRODUCT ERROR:", err.message);
      res.status(500).json({ error: "Failed to add product" });
    }
  }
);

// ================================
// PLACE ORDER
// ================================
app.post("/api/orders", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.sendStatus(401);

    const { items = [], total_amount } = req.body;
    if (!items.length) {
      return res.status(400).json({ error: "No items in order" });
    }

    const [[profile]] = await pool.query(
      `SELECT u.name, u.phone, a.address_line
       FROM users u
       LEFT JOIN addresses a ON u.id = a.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (!profile?.name || !profile?.phone || !profile?.address_line) {
      return res.status(400).json({
        error: "Complete profile before placing order",
      });
    }

    const [order] = await pool.query(
      `INSERT INTO orders
       (user_id, customer_name, total_amount, status, created_at)
       VALUES (?,?,?,?,NOW())`,
      [userId, profile.name, Number(total_amount), "PLACED"]
    );

    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, name, quantity, price)
         VALUES (?,?,?,?)`,
        [order.insertId, item.name, item.qty, item.price]
      );
    }

    res.json({ success: true, orderId: order.insertId });
  } catch (err) {
    console.error("ORDER ERROR:", err.message);
    res.status(500).json({ error: "Order failed" });
  }
});

// ================================
// ADMIN – VIEW ORDERS
// ================================
app.get("/api/admin/orders", adminAuth, async (_, res) => {
  try {
    const [orders] = await pool.query(
      "SELECT * FROM orders ORDER BY id DESC"
    );

    if (!orders.length) return res.json([]);

    const orderIds = orders.map(o => o.id);
    const [items] = await pool.query(
      "SELECT * FROM order_items WHERE order_id IN (?)",
      [orderIds]
    );

    const itemMap = {};
    items.forEach(i => {
      if (!itemMap[i.order_id]) itemMap[i.order_id] = [];
      itemMap[i.order_id].push(i);
    });

    orders.forEach(o => {
      o.items = itemMap[o.id] || [];
      o.total_amount = Number(o.total_amount) || 0;
    });

    res.json(orders);
  } catch (err) {
    console.error("ADMIN ORDERS ERROR:", err.message);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
