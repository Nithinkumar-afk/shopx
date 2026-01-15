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
    const [[products]] = await db.query(
      "SELECT COUNT(*) AS count FROM products"
    );

    const [[users]] = await db.query(
      "SELECT COUNT(*) AS count FROM users"
    );

    // Orders table may not exist yet
    let ordersCount = 0;
    let revenueTotal = 0;

    try {
      const [[orders]] = await db.query(
        "SELECT COUNT(*) AS count FROM orders"
      );
      ordersCount = orders.count;

      const [[revenue]] = await db.query(
        "SELECT IFNULL(SUM(total_amount),0) AS total FROM orders WHERE status != 'cancelled'"
      );
      revenueTotal = revenue.total;
    } catch (e) {
      // Orders table not created yet → SAFE FALLBACK
      ordersCount = 0;
      revenueTotal = 0;
    }

    res.json({
      products: products.count,
      orders: ordersCount,
      users: users.count,
      revenue: revenueTotal
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
        COALESCE(u.name, 'Guest') AS name,
        COALESCE(u.phone, '-') AS phone,
        o.total_amount AS total,
        o.created_at
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    res.json(rows);
  } catch (err) {
    // Orders table not ready yet
    res.json([]);
  }
};
