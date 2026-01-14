const express = require("express");
const router = express.Router();

/**
 * Controllers
 */
const productController = require("../controllers/product.controller");

/**
 * SAFETY CHECK
 * If controller failed to load, do NOT crash the server
 */
if (!productController) {
  console.error("❌ Product controller not loaded");

  router.all("*", (req, res) => {
    return res.status(503).json({
      message: "Product service unavailable",
    });
  });

  module.exports = router;
  return;
}

const {
  getProducts,
  addProduct,
  deleteProduct,
} = productController;

/**
 * PUBLIC ROUTES
 */
router.get("/", async (req, res) => {
  try {
    await getProducts(req, res);
  } catch (err) {
    console.error("❌ GET /products error:", err.message);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
});

/**
 * ADMIN ROUTES
 */
router.post("/", async (req, res) => {
  try {
    await addProduct(req, res);
  } catch (err) {
    console.error("❌ POST /products error:", err.message);
    return res.status(500).json({ message: "Failed to add product" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteProduct(req, res);
  } catch (err) {
    console.error("❌ DELETE /products error:", err.message);
    return res.status(500).json({ message: "Failed to delete product" });
  }
});

module.exports = router;
