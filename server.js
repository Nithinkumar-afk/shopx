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
const PORT = 5000;

// ================================
// MIDDLEWARE
// ================================
app.use(cors());
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
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ================================
// DATABASE
// ================================
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "ecommerce_db",
  waitForConnections: true,
  connectionLimit: 10,
});

console.log("✅ MySQL Pool Ready");

// ================================
// HELPER – USER ID (HEADER BASED)
// ================================
function getUserId(req) {
  const id = req.headers["x-user-id"];
  return id ? Number(id) : null;
}

// ================================
// TEST
// ================================
app.get("/", (_, res) => {
  res.send("JD Infotech Backend Running 🚀");
});

// ================================
// USER INIT (NO LOGIN)
// ================================
app.post("/api/user/init", async (_, res) => {
  const [r] = await db.query(
    "INSERT INTO users (name) VALUES ('Guest User')"
  );
  res.json({ userId: r.insertId });
});

// ================================
// PRODUCTS
// ================================
app.get("/api/products", async (_, res) => {
  const [rows] = await db.query(
    "SELECT * FROM products ORDER BY id DESC"
  );
  res.json(rows);
});

app.post("/api/products", upload.single("image"), async (req, res) => {
  const { name, price, description } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : "";

  await db.query(
    "INSERT INTO products (name,price,image,description) VALUES (?,?,?,?)",
    [name, price, image, description || ""]
  );

  res.json({ success: true });
});

app.delete("/api/products/:id", async (req, res) => {
  await db.query("DELETE FROM products WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

// ================================
// PROFILE
// ================================
app.get("/api/profile", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.json({});

  const [rows] = await db.query(
    `SELECT u.id,u.name,u.phone,u.alt_phone,u.image,a.address_line
     FROM users u
     LEFT JOIN addresses a ON u.id=a.user_id
     WHERE u.id=?`,
    [userId]
  );

  res.json(rows[0] || {});
});

app.post("/api/profile", upload.single("image"), async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.sendStatus(401);

  const { name, phone, altPhone } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  await db.query(
    `UPDATE users SET
     name=COALESCE(NULLIF(?,''),name),
     phone=COALESCE(NULLIF(?,''),phone),
     alt_phone=COALESCE(NULLIF(?,''),alt_phone),
     image=COALESCE(?,image)
     WHERE id=?`,
    [name, phone, altPhone, image, userId]
  );

  res.json({ success: true });
});

// ================================
// ADDRESS
// ================================
app.post("/api/profile/address", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.sendStatus(401);

  const { address_line } = req.body;

  const [rows] = await db.query(
    "SELECT id FROM addresses WHERE user_id=?",
    [userId]
  );

  if (rows.length) {
    await db.query(
      "UPDATE addresses SET address_line=? WHERE user_id=?",
      [address_line, userId]
    );
  } else {
    await db.query(
      "INSERT INTO addresses (user_id,address_line) VALUES (?,?)",
      [userId, address_line]
    );
  }

  res.json({ success: true });
});

// ================================
// PLACE ORDER (PROFILE REQUIRED)
// ================================
app.post("/api/orders", async (req, res) => {
  const userId = getUserId(req);
  if (!userId)
    return res.status(401).json({ error: "Unauthorized" });

  const { items = [], total_amount } = req.body;
  if (!items.length)
    return res.status(400).json({ error: "No items" });

  // 🔐 CHECK PROFILE COMPLETENESS
  const [rows] = await db.query(
    `SELECT u.name,u.phone,a.address_line
     FROM users u
     LEFT JOIN addresses a ON u.id=a.user_id
     WHERE u.id=?`,
    [userId]
  );

  const p = rows[0];
  if (!p || !p.name || !p.phone || !p.address_line) {
    return res.status(400).json({
      error: "Complete profile before placing order",
    });
  }

  const total = Number(total_amount) || 0;

  const [order] = await db.query(
    `INSERT INTO orders
     (customer_name,total_amount,status,created_at)
     VALUES (?,?,?,NOW())`,
    [p.name, total, "PLACED"]
  );

  const values = items.map(i => [
    order.insertId,
    i.name,
    i.qty,
    i.price,
  ]);

  await db.query(
    "INSERT INTO order_items (order_id,name,quantity,price) VALUES ?",
    [values]
  );

  res.json({ success: true, orderId: order.insertId });
});

// ================================
// GET ORDERS
// ================================
app.get("/api/orders", async (_, res) => {
  const [orders] = await db.query(
    "SELECT * FROM orders ORDER BY id DESC"
  );

  if (!orders.length) return res.json([]);

  const ids = orders.map(o => o.id);

  const [items] = await db.query(
    "SELECT * FROM order_items WHERE order_id IN (?)",
    [ids]
  );

  const map = {};
  items.forEach(i => {
    if (!map[i.order_id]) map[i.order_id] = [];
    map[i.order_id].push(i);
  });

  orders.forEach(o => {
    o.items = map[o.id] || [];
    o.total_amount = Number(o.total_amount) || 0;
  });

  res.json(orders);
});

// ================================
// USER – CANCEL ORDER
// ================================
app.put("/api/orders/:id/cancel", async (req, res) => {
  const [rows] = await db.query(
    "SELECT status FROM orders WHERE id=?",
    [req.params.id]
  );

  if (!rows.length)
    return res.status(404).json({ error: "Order not found" });

  if (rows[0].status !== "PLACED")
    return res.status(400).json({ error: "Cannot cancel now" });

  await db.query(
    "UPDATE orders SET status='CANCELLED' WHERE id=?",
    [req.params.id]
  );

  res.json({ success: true });
});

// ================================
// ADMIN – UPDATE ORDER STATUS
// ================================
app.put("/api/admin/orders/:id", async (req, res) => {
  const { status } = req.body;
  const deliveredAt = status === "DELIVERED" ? new Date() : null;

  await db.query(
    "UPDATE orders SET status=?, delivered_at=? WHERE id=?",
    [status, deliveredAt, req.params.id]
  );

  res.json({ success: true });
});

// ================================
// ADMIN – DELETE ORDER
// ================================
app.delete("/api/admin/orders/:id", async (req, res) => {
  await db.query("DELETE FROM order_items WHERE order_id=?", [req.params.id]);
  await db.query("DELETE FROM orders WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

// ================================
// ADMIN USERS
// ================================
app.get("/api/admin/users", async (_, res) => {
  const [rows] = await db.query(
    `SELECT u.id,u.name,u.phone,u.alt_phone,u.image,a.address_line
     FROM users u
     LEFT JOIN addresses a ON u.id=a.user_id
     ORDER BY u.id DESC`
  );
  res.json(rows);
});

// ================================
// ADMIN DASHBOARD STATS
// ================================
app.get("/api/admin/stats", async (_, res) => {
  const [[products]] = await db.query("SELECT COUNT(*) AS count FROM products");
  const [[orders]] = await db.query("SELECT COUNT(*) AS count FROM orders");
  const [[revenue]] = await db.query(
    "SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE status='DELIVERED'"
  );
  const [[users]] = await db.query("SELECT COUNT(*) AS count FROM users");

  res.json({
    products: Number(products.count),
    orders: Number(orders.count),
    revenue: Number(revenue.total),
    users: Number(users.count),
  });
});

// ================================
// START
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running → http://localhost:${PORT}`);
});

