const db = require("../config/db");

/* =====================================================
   GET ALL ORDERS (WITH ITEMS)
===================================================== */
exports.getAllOrders = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ message: "Database unavailable" });
    }

    const [orders] = await db.query(`
      SELECT
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        COALESCE(u.name, 'Guest') AS name,
        COALESCE(u.email, '-') AS email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);

    if (!orders.length) {
      return res.json([]);
    }

    /* ---------- NORMALIZE ---------- */
    orders.forEach(order => {
      order.status = (order.status || "placed").toLowerCase();
      order.items = [];
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

    const orderMap = {};
    orders.forEach(o => {
      orderMap[o.id] = o;
    });

    items.forEach(item => {
      if (orderMap[item.order_id]) {
        orderMap[item.order_id].items.push({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        });
      }
    });

    return res.json(orders);

  } catch (err) {
    console.error("❌ GET ORDERS ERROR:", err);
    return res.status(500).json({
      message: "Failed to fetch orders"
    });
  }
};

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */
exports.updateStatus = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ message: "Database unavailable" });
    }

    const orderId = Number(req.params.id);
    let { status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        message: "Order ID and status required"
      });
    }

    status = status.toLowerCase();
    const allowedStatuses = ["placed", "shipped", "delivered", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value"
      });
    }

    const [exists] = await db.query(
      "SELECT id FROM orders WHERE id = ?",
      [orderId]
    );

    if (!exists.length) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    await db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, orderId]
    );

    return res.json({
      message: "Order status updated",
      status
    });

  } catch (err) {
    console.error("❌ UPDATE STATUS ERROR:", err);
    return res.status(500).json({
      message: "Failed to update status"
    });
  }
};

/* =====================================================
   DELETE ORDER (SAFE TRANSACTION)
===================================================== */
exports.deleteOrder = async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: "Database unavailable" });
  }

  const orderId = Number(req.params.id);
  if (!orderId) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const conn = await db.getConnection();

  try {
    const [rows] = await conn.query(
      "SELECT status FROM orders WHERE id = ?",
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (rows[0].status === "delivered") {
      return res.status(400).json({
        message: "Delivered orders cannot be deleted"
      });
    }

    await conn.beginTransaction();

    await conn.query(
      "DELETE FROM order_items WHERE order_id = ?",
      [orderId]
    );

    // Optional table → ignore if not exists
    try {
      await conn.query(
        "DELETE FROM order_addresses WHERE order_id = ?",
        [orderId]
      );
    } catch (_) {}

    await conn.query(
      "DELETE FROM orders WHERE id = ?",
      [orderId]
    );

    await conn.commit();

    return res.json({
      message: "Order deleted successfully"
    });

  } catch (err) {
    await conn.rollback();
    console.error("❌ DELETE ORDER ERROR:", err);
    return res.status(500).json({
      message: "Failed to delete order"
    });
  } finally {
    conn.release();
  }
};
