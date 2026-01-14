const express = require("express");
const router = express.Router();

/**
 * Product Controller
 * Controller itself is DB-safe
 */
const productController = require("../controllers/product.controller");

/**
 * HARD FAIL SAFE
 * If controller fails to load (deploy / build issue)
 */
if (!productController) {
  console.error("❌ Product controller failed to load");

  router.use((req, res) => {
    return res.status(503).json({
      message: "Product service temporarily unavailable",
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
 * =========================
 * PUBLIC ROUTES
 * =========================
 */
router.get("/", getProducts);

/**
 * =========================
 * ADMIN ROUTES
 * (Auth middleware can be added later)
 * =========================
 */
router.post("/", addProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
