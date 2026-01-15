const db = require("../config/db");

/* =========================
   IMAGE URL RULES (STRICT)
========================= */
const CLOUDINARY_REGEX = /^https:\/\/res\.cloudinary\.com\//;
const IMAGEKIT_REGEX   = /^https:\/\/ik\.imagekit\.io\//;

const isValidImageURL = (url) =>
  typeof url === "string" &&
  (CLOUDINARY_REGEX.test(url) || IMAGEKIT_REGEX.test(url));

/* =========================
   DB DOWN HANDLER
========================= */
const dbDown = (res) =>
  res.status(503).json({ message: "Database unavailable" });

/* =========================
   NORMALIZE IMAGES (OUTPUT)
   ✔ No placeholder
========================= */
function normalizeImages(images) {
  try {
    let arr = [];

    if (Array.isArray(images)) {
      arr = images;
    } else if (typeof images === "string") {
      arr = JSON.parse(images);
    }

    return Array.isArray(arr)
      ? arr.filter(isValidImageURL)
      : [];
  } catch {
    return [];
  }
}

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
      images: normalizeImages(p.images) // ✅ only cloudinary/imagekit
    }));

    res.json(products);
  } catch (err) {
    console.error("❌ GET PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/* =========================
   ADD PRODUCT (ADMIN)
   ✔ STRICT IMAGE CHECK
========================= */
exports.addProduct = async (req, res) => {
  if (!db) return dbDown(res);

  const { name, price, category, description, images } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!Array.isArray(images) || !images.length) {
    return res.status(400).json({
      message: "At least one Cloudinary or ImageKit image is required"
    });
  }

  const cleanImages = images.filter(isValidImageURL);

  if (!cleanImages.length) {
    return res.status(400).json({
      message: "Only Cloudinary or ImageKit URLs are allowed"
    });
  }

  try {
    await db.query(
      `
      INSERT INTO products (name, price, category, description, images)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        name.trim(),
        Number(price),
        category.trim(),
        description?.trim() || "",
        JSON.stringify(cleanImages)
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
