const db = require("../config/db");

/* =========================
   FALLBACK IMAGE
========================= */
const FALLBACK_IMAGE =
  "https://via.placeholder.com/600x400?text=No+Image";

/* =========================
   ADD PRODUCT (ADMIN ONLY)
========================= */
exports.addProduct = async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: "Database unavailable" });
  }

  const { name, price, category, description, images } = req.body;

  // ✅ Validate required fields
  if (!name || price === undefined || !category) {
    return res.status(400).json({
      message: "Name, price and category are required"
    });
  }

  // ✅ Normalize images
  let finalImages = [];

  if (Array.isArray(images)) {
    finalImages = images
      .map(i => String(i).trim())
      .filter(Boolean);
  }

  if (!finalImages.length) {
    finalImages = [FALLBACK_IMAGE];
  }

  try {
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
        description?.trim() || "",
        JSON.stringify(finalImages)
      ]
    );

    res.status(201).json({
      message: "Product added successfully"
    });

  } catch (err) {
    console.error("❌ ADD PRODUCT ERROR:", err);
    res.status(500).json({
      message: "Failed to add product"
    });
  }
};

/* =========================
   DELETE PRODUCT (ADMIN ONLY)
========================= */
exports.deleteProduct = async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: "Database unavailable" });
  }

  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const [result] = await db.query(
      "DELETE FROM products WHERE id = ?",
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product deleted successfully"
    });

  } catch (err) {
    console.error("❌ DELETE PRODUCT ERROR:", err);
    res.status(500).json({
      message: "Failed to delete product"
    });
  }
};
