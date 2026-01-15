const db = require("../config/db");
const jwt = require("jsonwebtoken");

/* ================= ADMIN LOGIN ================= */
exports.login = (req, res) => {
  try {
    const { username, password } = req.body;

    // ❌ Missing fields
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // Normalize input
    const u = username.trim();
    const p = password.trim();

    // ❌ Invalid credentials
    if (u !== "admin" || p !== "admin123") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ❌ Missing JWT secret
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET missing");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    // ✅ Generate token
    const token = jwt.sign(
      {
        id: 1,
        role: "admin"
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });

  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= DASHBOARD STATS ================= */
exports.getStats = async (req, res) => {
  try {
    const [[p]] = await db.query("SELECT COUNT(*) AS count FROM products");
    const [[o]] = await db.query("SELECT COUNT(*) AS count FROM orders");
    const [[u]] = await db.query("SELECT COUNT(*) AS count FROM users");
    const [[r]] = await db.query(
      "SELECT IFNULL(SUM(total_amount),0) AS total FROM orders WHERE status != 'cancelled'"
    );

    res.json({
      products: p.count,
      orders: o.count,
      users: u.count,
      revenue: r.total
    });

  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
};

/* ================= RECENT ORDERS ================= */
exports.getRecentOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.name AS name,
        u.phone AS phone,
        o.total_amount AS total,
        o.created_at AS created_at
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    res.json(rows);

  } catch (err) {
    console.error("RECENT ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to load recent orders" });
  }
};
