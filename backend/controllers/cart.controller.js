const db = require("../config/db");

/* ================= GET CART ================= */
exports.getCart = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        c.product_id,
        c.qty,
        p.name,
        p.price,
        p.images
      FROM cart c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ?
      `,
      [req.user.id]
    );

    const cart = rows.map(item => ({
      productId: item.product_id,
      qty: item.qty,
      name: item.name,
      price: Number(item.price),
      images: safeParseImages(item.images)
    }));

    res.json(cart);
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ message: "Failed to load cart" });
  }
};

/* ================= ADD TO CART ================= */
exports.addToCart = async (req, res) => {
  try {
    const productId = Number(req.body.productId);
    const qty = Number(req.body.qty || 1);

    if (!productId || qty < 1) {
      return res.status(400).json({ message: "Invalid product or quantity" });
    }

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
    res.status(500).json({ message: "Failed to add to cart" });
  }
};

/* ================= UPDATE QTY ================= */
exports.updateQty = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const qty = Number(req.body.qty);

    if (!productId || qty < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const [result] = await db.query(
      `UPDATE cart SET qty=? WHERE user_id=? AND product_id=?`,
      [qty, req.user.id, productId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ message: "Quantity updated" });
  } catch (err) {
    console.error("UPDATE CART ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

/* ================= REMOVE ITEM ================= */
exports.removeItem = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    if (!productId) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const [result] = await db.query(
      `DELETE FROM cart WHERE user_id=? AND product_id=?`,
      [req.user.id, productId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    res.json({ message: "Item removed" });
  } catch (err) {
    console.error("REMOVE CART ERROR:", err);
    res.status(500).json({ message: "Remove failed" });
  }
};

/* ================= CLEAR CART ================= */
exports.clearCart = async (req, res) => {
  try {
    await db.query(`DELETE FROM cart WHERE user_id=?`, [req.user.id]);
    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("CLEAR CART ERROR:", err);
    res.status(500).json({ message: "Clear failed" });
  }
};

/* ================= HELPER ================= */
function safeParseImages(images) {
  try {
    return JSON.parse(images || "[]");
  } catch {
    return [];
  }
}
