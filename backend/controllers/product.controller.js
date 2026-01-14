const db = require("../config/db");

/* =====================================================
   DB SAFETY HANDLER
===================================================== */
const dbDown = (res) =>
  res.status(503).json({ message: "Database unavailable" });

const DEFAULT_IMAGE =
  "https://via.placeholder.com/600x400?text=No+Image";

/* =====================================================
   GET ALL PRODUCTS (PUBLIC)
===================================================== */
exports.getProducts = async (req, res) => {
  if (!db) return dbDown(res);

  try {
    const [products] = await db.query(`
      SELECT id, name, price, category, description, images,
      IFNULL(is_active,1) AS is_active
      FROM products
      WHERE is_active = 1
      ORDER BY id DESC
    `);

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category,
      description: p.description,
      images: safeParseImages(p.images),
      is_active: Boolean(p.is_active),
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ GET PRODUCTS:", err.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/* =====================================================
   ADD PRODUCT (ADMIN)
===================================================== */
exports.addProduct = async (req, res) => {
  if (!db) return dbDown(res);

  let { name, price, category, description, images } = req.body;

  // BASIC REQUIRED FIELDS
  if (!name || typeof price !== "number" || !category) {
    return res.status(400).json({
      message: "Name, price and category are required",
    });
  }

  // IMAGES OPTIONAL
  if (!Array.isArray(images)) images = [];

  if (images.length === 0) {
    images = [DEFAULT_IMAGE];
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
        description ? description.trim() : "",
        JSON.stringify(images),
      ]
    );

    res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    console.error("❌ ADD PRODUCT:", err.message);
    res.status(500).json({ message: "Failed to add product" });
  }
};

/* =====================================================
   DELETE PRODUCT (ADMIN)
===================================================== */
exports.deleteProduct = async (req, res) => {
  if (!db) return dbDown(res);

  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid ID" });

  try {
    const [r] = await db.query(
      "UPDATE products SET is_active = 0 WHERE id = ?",
      [id]
    );

    if (!r.affectedRows) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE PRODUCT:", err.message);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

/* =====================================================
   HELPER
===================================================== */
function safeParseImages(images) {
  try {
    const arr = images ? JSON.parse(images) : [];
    return Array.isArray(arr) && arr.length ? arr : [DEFAULT_IMAGE];
  } catch {
    return [DEFAULT_IMAGE];
  }
}
