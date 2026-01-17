const db = require("../config/db");

/* =========================
   FALLBACK IMAGE
========================= */
const FALLBACK_IMAGE =
  "https://via.placeholder.com/600x400?text=No+Image";

/* =========================
   ADD PRODUCT (NO LOGIN)
========================= */
exports.addProduct = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        message: "Database unavailable"
      });
    }

    const {
      name,
      price,
      category,
      description = "",
      images
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!name || price === undefined || !category) {
      return res.status(400).json({
        message: "Name, price and category are required"
      });
    }

    if (isNaN(price)) {
      return res.status(400).json({
        message: "Price must be a number"
      });
    }

    /* ---------- NORMALIZE IMAGES ---------- */
    let finalImages = [];

    if (Array.isArray(images)) {
      finalImages = images
        .map(img => String(img).trim())
        .filter(Boolean);
    }

    if (!finalImages.length) {
      finalImages = [FALLBACK_IMAGE];
    }

    /* ---------- INSERT PRODUCT ---------- */
    await db.query(
      `
      INSERT INTO products
        (name, price, category, description, images)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        name.trim(),
        Number(price),
        category.trim(),
        description.trim(),
        JSON.stringify(finalImages)
      ]
    );

    return res.status(201).json({
      message: "Product added successfully"
    });

  } catch (err) {
    console.error("❌ ADD PRODUCT ERROR:", err);
    return res.status(500).json({
      message: "Failed to add product"
    });
  }
};

/* =========================
   DELETE PRODUCT (NO LOGIN)
========================= */
exports.deleteProduct = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        message: "Database unavailable"
      });
    }

    const productId = Number(req.params.id);

    if (!productId) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const [result] = await db.query(
      "DELETE FROM products WHERE id = ?",
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.json({
      message: "Product deleted successfully"
    });

  } catch (err) {
    console.error("❌ DELETE PRODUCT ERROR:", err);
    return res.status(500).json({
      message: "Failed to delete product"
    });
  }
};
