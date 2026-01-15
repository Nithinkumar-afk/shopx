const db = require("../config/db");

/* =====================================================
   ADMIN - GET ALL ORDERS (WITH ITEMS)
===================================================== */
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        u.name,
        u.email
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);

    if (!orders.length) {
      return res.json([]);
    }

    // Normalize status + init items
    orders.forEach(o => {
      o.status = (o.status || "placed").toLowerCase();
      o.items = [];
    });

    const orderIds = orders.map(o => o.id);

    const [items] = await db.query(
      `
      SELECT
        oi.order_id,
        p.name,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id IN (?)
      `,
      [orderIds]
    );

    const map = {};
    orders.forEach(o => (map[o.id] = o));

    items.forEach(i => {
      if (map[i.order_id]) {
        map[i.order_id].items.push({
          name: i.name,
          quantity: i.quantity,
          price: i.price
        });
      }
    });

    res.json(orders);
  } catch (err) {
    console.error("ADMIN GET ORDERS ERROR:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* =====================================================
   ADMIN - GET DASHBOARD STATS (🔥 FIXES REVENUE)
===================================================== */
exports.getDashboardStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) AS totalOrders,
        COALESCE(SUM(
          CASE
            WHEN status = 'delivered' THEN total_amount
            ELSE 0
          END
        ), 0) AS totalRevenue
      FROM orders
    `);

    const [[users]] = await db.query(`
      SELECT COUNT(*) AS totalUsers FROM users
    `);

    res.json({
      totalOrders: stats.totalOrders,
      totalRevenue: Number(stats.totalRevenue),
      totalUsers: users.totalUsers
    });
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err.message);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};

/* =====================================================
   ADMIN - UPDATE ORDER STATUS
===================================================== */
exports.updateStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    let { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    status = status.toLowerCase();

    const allowed = ["placed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [rows] = await db.query(
      "SELECT id FROM orders WHERE id = ?",
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    await db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, orderId]
    );

    res.json({ message: "Order status updated", status });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err.message);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

/* =====================================================
   ADMIN - DELETE ORDER
===================================================== */
exports.deleteOrder = async (req, res) => {
  const orderId = req.params.id;
  const connection = await db.getConnection();

  try {
    const [rows] = await connection.query(
      "SELECT status FROM orders WHERE id = ?",
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (rows[0].status === "delivered") {
      return res.status(400).json({
        message: "Delivered orders cannot be deleted"
      });
    }

    await connection.beginTransaction();

    await connection.query(
      "DELETE FROM order_items WHERE order_id = ?",
      [orderId]
    );
    await connection.query(
      "DELETE FROM order_addresses WHERE order_id = ?",
      [orderId]
    );
    await connection.query(
      "DELETE FROM orders WHERE id = ?",
      [orderId]
    );

    await connection.commit();

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("DELETE ORDER ERROR:", err.message);
    res.status(500).json({ message: "Failed to delete order" });
  } finally {
    connection.release();
  }
};
