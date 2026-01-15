const db = require("../config/db");
const jwt = require("jsonwebtoken");

/* ================= ADMIN LOGIN ================= */
exports.login = (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate
    if (!username || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    // Static admin (simple & safe)
    if (username !== "admin" || password !== "admin123") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    const token = jwt.sign(
      {
        id: 1,
        username: "admin",
        role: "admin"
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token
    });

  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= DASHBOARD STATS ================= */
exports.getStats = async (req, res) => {
  try {
    let products = 0;
    let users = 0;
    let orders = 0;
    let revenue = 0;

    try {
      const [[p]] = await db.query("SELECT COUNT(*) AS count FROM products");
      products = p.count;
    } catch {}

    try {
      const [[u]] = await db.query("SELECT COUNT(*) AS count FROM users");
      users = u.count;
    } catch {}

    try {
      const [[o]] = await db.query("SELECT COUNT(*) AS count FROM orders");
      orders = o.count;

      const [[r]] = await db.query(
        "SELECT IFNULL(SUM(total_amount),0) AS total FROM orders WHERE status != 'cancelled'"
      );
      revenue = r.total;
    } catch {}

    res.json({ products, users, orders, revenue });

  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
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
    console.warn("RECENT ORDERS TABLE NOT READY");
    res.json([]);
  }
};
