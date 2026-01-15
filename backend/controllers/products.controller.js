const db = require("../config/db");

const DEFAULT_IMAGE =
  "https://via.placeholder.com/600x400?text=No+Image";

/* =========================
   DB DOWN HANDLER
========================= */
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
      ORDER BY id DESC
    `);

    const products = rows.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category,
      description: p.description || "",
      images: normalizeImages(p.images)
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
    image3
  } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  let finalImages = [];

  // 1️⃣ Prefer images array (future-proof)
  if (Array.isArray(images)) {
    finalImages = images;
  } else {
    // 2️⃣ Fallback to image1,image2,image3
    finalImages = [image1, image2, image3];
  }

  // 3️⃣ Clean invalid URLs
  finalImages = finalImages
    .filter(img => typeof img === "string" && img.trim());

  // 4️⃣ Always guarantee at least one image
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
        JSON.stringify(finalImages)
      ]
    );

    res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    console.error("❌ ADD PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to add product" });
  }
};

/* =========================
   DELETE PRODUCT (ADMIN)
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
   IMAGE NORMALIZER (CORE FIX)
========================= */
function normalizeImages(images) {
  try {
    // Already array → fastest path
    if (Array.isArray(images)) {
      return images.length ? images : [DEFAULT_IMAGE];
    }

    // JSON string → parse once
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.filter(
        img => typeof img === "string" && img.trim()
      );
    }

    return [DEFAULT_IMAGE];
  } catch {
    return [DEFAULT_IMAGE];
  }
}
