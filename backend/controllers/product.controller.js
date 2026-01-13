const db = require("../config/db");

/* =====================================================
   GET ALL PRODUCTS (PUBLIC)
   Only active products are returned
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

    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      description: p.description,
      images: safeParseImages(p.images),
      is_active: p.is_active
    }));

    res.status(200).json(formattedProducts);

  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
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
      INSERT INTO products (name, price, category, description, images, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
      `,
      [
        name.trim(),
        price,
        category.trim(),
        description?.trim() || "",
        JSON.stringify(images)
      ]
    );

    res.status(201).json({ message: "Product added successfully" });

  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to add product" });
  }
};

/* =====================================================
   DELETE PRODUCT (ADMIN)
   SOFT DELETE (Recommended for production)
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

    res.status(200).json({ message: "Product deleted successfully" });

  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

/* =====================================================
   HELPER FUNCTION
===================================================== */
function safeParseImages(images) {
  try {
    return JSON.parse(images || "[]");
  } catch {
    return [];
  }
}
