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
    const [rows] = await db.query(`
      SELECT id, name, price, category, description, images
      FROM products
      WHERE is_active = 1
      ORDER BY id DESC
    `);

    const products = rows.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category,
      description: p.description,
      images: parseImages(p.images),
    }));

    res.json(products);
  } catch (err) {
    console.error("❌ GET PRODUCTS:", err.message);
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
    image1,
    image2,
    image3,
    images, // ✅ support array too (important)
  } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // ✅ SAFELY BUILD IMAGE ARRAY (NO BUGS)
  let finalImages = [];

  if (Array.isArray(images)) {
    finalImages = images
      .filter((img) => typeof img === "string" && img.trim() !== "");
  } else {
    finalImages = [image1, image2, image3]
      .filter((img) => typeof img === "string" && img.trim() !== "");
  }

  if (finalImages.length === 0) {
    finalImages = [DEFAULT_IMAGE];
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
        Number(price),
        category.trim(),
        description?.trim() || "",
        JSON.stringify(finalImages),
      ]
    );

    res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    console.error("❌ ADD PRODUCT:", err.message);
    res.status(500).json({ message: "Failed to add product" });
  }
};

/* =========================
   DELETE PRODUCT
========================= */
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

/* =========================
   HELPER
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
