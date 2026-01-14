const db = require("../config/db");

/**
 * HARD SAFETY CHECK
 * If DB is not initialized, never crash routes
 */
if (!db) {
  console.error("❌ Database not initialized in product.controller");

  const dbDown = (res) =>
    res.status(503).json({
      message: "Database unavailable",
    });

  exports.getProducts = async (req, res) => dbDown(res);
  exports.addProduct = async (req, res) => dbDown(res);
  exports.deleteProduct = async (req, res) => dbDown(res);
  return;
}

/* =====================================================
   GET ALL PRODUCTS (PUBLIC)
===================================================== */
exports.getProducts = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        id,
        name,
        price,
        category,
        description,
        images,
        IFNULL(is_active, 1) AS is_active
      FROM products
      WHERE is_active = 1
      ORDER BY id DESC
    `);

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category,
      description: p.description,
      images: safeParseImages(p.images),
      is_active: Boolean(p.is_active),
    }));

    return res.status(200).json(formattedProducts);
  } catch (err) {
    console.error("❌ GET PRODUCTS ERROR:", err.message);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

/* =====================================================
   ADD PRODUCT (ADMIN)
===================================================== */
exports.addProduct = async (req, res) => {
  const { name, price, category, description, images } = req.body;

  if (
    !name ||
    typeof price !== "number" ||
    !category ||
    !Array.isArray(images) ||
    images.length === 0
  ) {
    return res.status(400).json({ message: "Invalid or missing fields" });
  }

  try {
    await db.query(
      `
      INSERT INTO products 
      (name, price, category, description, images, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
      `,
      [
        name.trim(),
        price,
        category.trim(),
        description?.trim() || "",
        JSON.stringify(images),
      ]
    );

    return res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    console.error("❌ ADD PRODUCT ERROR:", err.message);
    return res.status(500).json({ message: "Failed to add product" });
  }
};

/* =====================================================
   DELETE PRODUCT (ADMIN) — SOFT DELETE
===================================================== */
exports.deleteProduct = async (req, res) => {
  const productId = Number(req.params.id);

  if (!productId) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const [result] = await db.query(
      "UPDATE products SET is_active = 0 WHERE id = ?",
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE PRODUCT ERROR:", err.message);
    return res.status(500).json({ message: "Failed to delete product" });
  }
};

/* =====================================================
   HELPER
===================================================== */
function safeParseImages(images) {
  try {
    return JSON.parse(images || "[]");
  } catch {
    return [];
  }
}
