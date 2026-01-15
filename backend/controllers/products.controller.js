const db = require("../config/db");

const DEFAULT_IMAGE =
  "https://via.placeholder.com/600x400?text=No+Image";

const dbDown = (res) =>
  res.status(503).json({ message: "Database unavailable" });

/* =========================
   GET ALL PRODUCTS (PUBLIC)
========================= */
exports.getProducts = async (req, res) => {
  if (!db) return dbDown(res);

  try {
    // ✅ SAFE QUERY (no dependency on is_active)
    const [rows] = await db.query(`
      SELECT id, name, price, category, description, images
      FROM products
      ORDER BY id DESC
    `);

    const products = rows.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category,
      description: p.description || "",
      images: parseImages(p.images),
    }));

    res.json(products);
  } catch (err) {
    console.error("❌ GET PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/* =========================
   ADD PRODUCT (ADMIN)
========================= */
exports.addProduct = async (req, res) => {
  if (!db) return dbDown(res);

  const {
    name,
    price,
    category,
    description,
    images,
    image1,
    image2,
    image3,
  } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // ✅ SAFE IMAGE HANDLING
  let finalImages = [];

  if (Array.isArray(images)) {
    finalImages = images.filter(Boolean);
  } else {
    finalImages = [image1, image2, image3].filter(Boolean);
  }

  if (!finalImages.length) {
    finalImages = [DEFAULT_IMAGE];
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
        JSON.stringify(finalImages),
      ]
    );

    res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    console.error("❌ ADD PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to add product" });
  }
};

/* =========================
   DELETE PRODUCT (HARD DELETE)
========================= */
exports.deleteProduct = async (req, res) => {
  if (!db) return dbDown(res);

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
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

/* =========================
   HELPERS
========================= */
function parseImages(images) {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length
      ? arr
      : [DEFAULT_IMAGE];
  } catch {
    return [DEFAULT_IMAGE];
  }
}
