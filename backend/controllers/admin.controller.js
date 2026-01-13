const db = require("../config/db");
const jwt = require("jsonwebtoken");

/* =====================
   ADMIN LOGIN
===================== */
exports.login = (req, res) => {
  const { username, password } = req.body;

  if (username !== "admin" || password !== "admin123") {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: 1, username: "admin", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
};

/* =====================
   DASHBOARD STATS
===================== */
exports.getStats = async (req, res) => {
  try {
    const [[products]] = await db.query(
      "SELECT COUNT(*) AS count FROM products"
    );

    const [[orders]] = await db.query(
      "SELECT COUNT(*) AS count FROM orders"
    );

    const [[users]] = await db.query(
      "SELECT COUNT(*) AS count FROM users"
    );

    const [[revenue]] = await db.query(
      "SELECT IFNULL(SUM(total_amount),0) AS total FROM orders WHERE status != 'cancelled'"
    );

    res.json({
      products: products.count,
      orders: orders.count,
      users: users.count,
      revenue: revenue.total
    });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
};

/* =====================
   RECENT ORDERS
===================== */
exports.getRecentOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.total_amount AS total,
        o.created_at,
        u.name,
        u.phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    res.json(orders);
  } catch (err) {
    console.error("RECENT ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to load recent orders" });
  }
};
