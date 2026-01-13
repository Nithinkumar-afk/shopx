const db = require("../config/db");

/* ===============================
   GET CART
================================ */
exports.getCart = async (req, res) => {
  try {
    const [items] = await db.query(
      `
      SELECT 
        c.product_id,
        c.qty,
        p.name,
        p.price,
        NULL AS image
      FROM cart c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ?
      `,
      [req.user.id]
    );

    let total = 0;
    items.forEach(i => {
      total += Number(i.price) * Number(i.qty);
    });

    res.json({
      items,
      total
    });

  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ message: "Failed to load cart" });
  }
};

/* ===============================
   ADD TO CART
================================ */
exports.addToCart = async (req, res) => {
  const { productId, qty = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product ID required" });
  }

  try {
    await db.query(
      `
      INSERT INTO cart (user_id, product_id, qty)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE qty = qty + ?
      `,
      [req.user.id, productId, qty, qty]
    );

    res.json({ message: "Added to cart" });
  } catch (err) {
    console.error("ADD CART ERROR:", err);
    res.status(500).json({ message: "Failed to add cart" });
  }
};

/* ===============================
   UPDATE QUANTITY
================================ */
exports.updateQty = async (req, res) => {
  const { productId } = req.params;
  const { qty } = req.body;

  if (!qty || qty < 1) {
    return res.status(400).json({ message: "Invalid quantity" });
  }

  try {
    await db.query(
      `
      UPDATE cart SET qty=?
      WHERE user_id=? AND product_id=?
      `,
      [qty, req.user.id, productId]
    );

    res.json({ message: "Quantity updated" });
  } catch (err) {
    console.error("UPDATE CART ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

/* ===============================
   REMOVE ITEM
================================ */
exports.removeItem = async (req, res) => {
  const { productId } = req.params;

  try {
    await db.query(
      `
      DELETE FROM cart
      WHERE user_id=? AND product_id=?
      `,
      [req.user.id, productId]
    );

    res.json({ message: "Item removed" });
  } catch (err) {
    console.error("REMOVE CART ERROR:", err);
    res.status(500).json({ message: "Remove failed" });
  }
};

/* ===============================
   CLEAR CART
================================ */
exports.clearCart = async (req, res) => {
  try {
    await db.query(
      `DELETE FROM cart WHERE user_id=?`,
      [req.user.id]
    );

    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("CLEAR CART ERROR:", err);
    res.status(500).json({ message: "Clear failed" });
  }
};
