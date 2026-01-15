const db = require("../config/db");

/* ===============================
   GET USER ORDERS (WITH ITEMS)
================================ */
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [rows] = await db.query(
      `
      SELECT
        o.id AS order_id,
        o.total_amount,
        o.status,
        o.address,
        o.created_at,
        oi.quantity,
        oi.price,
        p.name,
        p.images
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      `,
      [userId]
    );

    const ordersMap = {};

    for (const r of rows) {
      if (!ordersMap[r.order_id]) {
        ordersMap[r.order_id] = {
          id: r.order_id,
          total_amount: Number(r.total_amount),
          status: r.status,
          address: r.address,
          created_at: r.created_at,
          items: []
        };
      }

      if (r.name) {
        let images = [];
        try {
          images = JSON.parse(r.images || "[]");
        } catch {}

        ordersMap[r.order_id].items.push({
          name: r.name,
          price: Number(r.price),
          quantity: Number(r.quantity),
          image: images[0] || ""
        });
      }
    }

    res.json(Object.values(ordersMap));
  } catch (err) {
    console.error("GET USER ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* ===============================
   GET SINGLE ORDER
================================ */
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = Number(req.params.id);

    if (!userId || !orderId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const [[order]] = await db.query(
      `
      SELECT id, total_amount, status, address, created_at
      FROM orders
      WHERE id = ? AND user_id = ?
      `,
      [orderId, userId]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const [items] = await db.query(
      `
      SELECT oi.quantity, oi.price, p.name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      `,
      [orderId]
    );

    order.items = items;
    res.json(order);
  } catch (err) {
    console.error("GET ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

/* ===============================
   PLACE ORDER (FIXED)
================================ */
exports.placeOrder = async (req, res) => {
  let connection;

  try {
    const userId = req.user?.id;
    const { total_amount, address, items } = req.body;

    if (
      !userId ||
      typeof total_amount !== "number" ||
      total_amount < 0 ||
      !address ||
      !Array.isArray(items) ||
      !items.length
    ) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `
      INSERT INTO orders (user_id, total_amount, status, address)
      VALUES (?, ?, 'placed', ?)
      `,
      [userId, total_amount, address]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
        `,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Order placed successfully",
      order_id: orderId
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("PLACE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to place order" });
  } finally {
    if (connection) connection.release();
  }
};

/* ===============================
   CANCEL ORDER
================================ */
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = Number(req.params.id);

    if (!userId || !orderId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const [result] = await db.query(
      `
      UPDATE orders
      SET status = 'cancelled'
      WHERE id = ? AND user_id = ? AND status = 'placed'
      `,
      [orderId, userId]
    );

    if (!result.affectedRows) {
      return res.status(400).json({ message: "Order cannot be cancelled" });
    }

    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

/* ===============================
   GET LATEST ORDER
================================ */
exports.getLatestOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [[order]] = await db.query(
      `
      SELECT id, total_amount, status, address, created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId]
    );

    if (!order) {
      return res.status(404).json({ message: "No orders found" });
    }

    const [items] = await db.query(
      `
      SELECT oi.quantity, oi.price, p.name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      `,
      [order.id]
    );

    order.items = items;
    res.json(order);
  } catch (err) {
    console.error("GET LATEST ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to load order" });
  }
};
