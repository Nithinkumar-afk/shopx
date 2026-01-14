const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
} = require("../controllers/products.controller");

/**
 * =========================
 * PUBLIC PRODUCT ROUTES
 * =========================
 */
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
