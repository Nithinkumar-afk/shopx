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
        COALESCE(u.name, 'Guest') AS name,
        COALESCE(u.email, '-') AS email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);

    if (!orders.length) return res.json([]);

    orders.forEach(o => {
      o.status = (o.status || "placed").toLowerCase();
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
   ADMIN - UPDATE ORDER STATUS
===================================================== */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status required" });
    }

    status = status.toLowerCase();
    const allowed = ["placed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [rows] = await db.query(
      "SELECT id FROM orders WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    await db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    res.json({ message: "Status updated", status });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err.message);
    res.status(500).json({ message: "Failed to update status" });
  }
};

/* =====================================================
   ADMIN - DELETE ORDER (SAFE)
===================================================== */
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();

  try {
    const [rows] = await conn.query(
      "SELECT status FROM orders WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (rows[0].status === "delivered") {
      return res
        .status(400)
        .json({ message: "Delivered orders cannot be deleted" });
    }

    await conn.beginTransaction();

    await conn.query("DELETE FROM order_items WHERE order_id = ?", [id]);

    // Optional table → safe delete
    try {
      await conn.query(
        "DELETE FROM order_addresses WHERE order_id = ?",
        [id]
      );
    } catch (_) {}

    await conn.query("DELETE FROM orders WHERE id = ?", [id]);

    await conn.commit();

    res.json({ message: "Order deleted" });
  } catch (err) {
    await conn.rollback();
    console.error("DELETE ORDER ERROR:", err.message);
    res.status(500).json({ message: "Delete failed" });
  } finally {
    conn.release();
  }
};
