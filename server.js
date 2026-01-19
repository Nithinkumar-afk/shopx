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
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-api-key", "x-user-id"]
}));

app.options("*", cors());
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

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  }
});

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

// Test DB
(async () => {
  try {
    const c = await pool.getConnection();
    console.log("✅ MySQL Connected");
    c.release();
  } catch (e) {
    console.error("❌ MySQL Error:", e.message);
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
// USER INIT
// ================================
app.post("/api/user/init", async (_, res) => {
  try {
    const [r] = await pool.query(
      "INSERT INTO users (name) VALUES ('Guest User')"
    );
    res.json({ userId: r.insertId });
  } catch {
    res.status(500).json({ error: "User init failed" });
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
  } catch {
    res.status(500).json({ error: "Load products failed" });
  }
});

app.post("/api/products",
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
    } catch {
      res.status(500).json({ error: "Add product failed" });
    }
  }
);

app.delete("/api/products/:id", adminAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete product failed" });
  }
});

// ================================
// PLACE ORDER
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
  } catch {
    res.status(500).json({ error: "Order failed" });
  }
});

// ================================
// ADMIN ORDERS
// ================================
app.get("/api/admin/orders", adminAuth, async (_, res) => {
  try {
    const [orders] = await pool.query(
      "SELECT * FROM orders ORDER BY id DESC"
    );

    if (!orders.length) return res.json([]);

    const ids = orders.map(o => o.id);
    const [items] = await pool.query(
      "SELECT * FROM order_items WHERE order_id IN (?)",
      [ids]
    );

    const map = {};
    items.forEach(i => {
      if (!map[i.order_id]) map[i.order_id] = [];
      map[i.order_id].push(i);
    });

    orders.forEach(o => o.items = map[o.id] || []);
    res.json(orders);
  } catch {
    res.status(500).json({ error: "Load orders failed" });
  }
});

// ================================
// UPDATE ORDER STATUS
// ================================
app.put("/api/admin/orders/:id", adminAuth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE orders SET status=? WHERE id=?",
      [req.body.status, req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

// ================================
// DELETE ORDER
// ================================
app.delete("/api/admin/orders/:id", adminAuth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM order_items WHERE order_id=?",
      [req.params.id]
    );
    await pool.query(
      "DELETE FROM orders WHERE id=?",
      [req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ================================
// ADMIN STATS
// ================================
app.get("/api/admin/stats", adminAuth, async (_, res) => {
  try {
    const [[p]] = await pool.query("SELECT COUNT(*) AS c FROM products");
    const [[o]] = await pool.query("SELECT COUNT(*) AS c FROM orders");
    const [[r]] = await pool.query("SELECT SUM(total_amount) AS s FROM orders");

    res.json({
      products: p.c || 0,
      orders: o.c || 0,
      revenue: r.s || 0
    });
  } catch {
    res.status(500).json({ error: "Stats failed" });
  }
});

// ================================
// ADMIN USERS
// ================================
app.get("/api/admin/users", adminAuth, async (_, res) => {
  try {
    const [u] = await pool.query(
      "SELECT id, name, phone FROM users ORDER BY id DESC"
    );
    res.json(u);
  } catch {
    res.status(500).json({ error: "Users load failed" });
  }
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
