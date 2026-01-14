const express = require("express");
const router = express.Router();

let productController;

try {
  productController = require("../controllers/product.controller");
} catch (err) {
  console.error("❌ Failed to load Product Controller:", err.message);

  router.all("*", (req, res) => {
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
 * =========================
 */
router.post("/", addProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
