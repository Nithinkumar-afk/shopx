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
        o.created_at,
        LOWER(o.status) AS raw_status,
        u.name,
        u.phone
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);

    if (!orders.length) {
      return res.json([]);
    }

    // 🔥 NORMALIZE STATUS
    orders.forEach(o => {
      let s = o.raw_status || "placed";

      if (s.includes("place") || s === "pending") s = "placed";
      else if (s.includes("ship")) s = "shipped";
      else if (s.includes("deliver")) s = "delivered";
      else if (s.includes("cancel")) s = "cancelled";

      o.status = s;
      delete o.raw_status;
      o.items = [];
    });

    const orderIds = orders.map(o => o.id);

    const [items] = await db.query(`
      SELECT
        oi.order_id,
        p.name,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id IN (?)
    `, [orderIds]);

    const map = {};
    orders.forEach(o => map[o.id] = o);

    items.forEach(i => {
      if (map[i.order_id]) {
        map[i.order_id].items.push({
          name: i.name,
          quantity: i.quantity,
          price: i.price
        });
      }
    });

    // ✅ ALWAYS RETURN ARRAY
    res.json(orders);

  } catch (err) {
    console.error("ADMIN GET ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
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
      return res.status(400).json({ message: "Invalid status value" });
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

    res.json({
      message: "Order status updated",
      status
    });

  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

/* =====================================================
   ADMIN - DELETE ORDER (TRANSACTION SAFE)
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
    console.error("DELETE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to delete order" });
  } finally {
    connection.release();
  }
};
