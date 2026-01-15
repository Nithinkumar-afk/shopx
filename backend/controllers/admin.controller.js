const db = require("../config/db");
const jwt = require("jsonwebtoken");

/* ================= ADMIN LOGIN ================= */
exports.login = (req, res) => {
  const { username, password } = req.body;

  if (username !== "admin" || password !== "admin123") {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: 1, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
};

/* ================= DASHBOARD STATS ================= */
exports.getStats = async (req, res) => {
  try {
    const [[p]] = await db.query("SELECT COUNT(*) count FROM products");
    const [[o]] = await db.query("SELECT COUNT(*) count FROM orders");
    const [[u]] = await db.query("SELECT COUNT(*) count FROM users");
    const [[r]] = await db.query(
      "SELECT IFNULL(SUM(total_amount),0) total FROM orders WHERE status!='cancelled'"
    );

    res.json({
      products: p.count,
      orders: o.count,
      users: u.count,
      revenue: r.total
    });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: "Stats failed" });
  }
};

/* ================= RECENT ORDERS ================= */
exports.getRecentOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.name,
        u.phone,
        o.total_amount AS total,
        o.created_at
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    res.json(rows);
  } catch (err) {
    console.error("RECENT ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
};
