const express = require("express");
const router = express.Router();

const {
  addProduct,
  deleteProduct,
} = require("../controllers/products.controller"); // ✅ MUST MATCH FILE NAME

const adminAuth = require("../middleware/auth.middleware");

/**
 * =========================
 * ADMIN PRODUCT ROUTES
 * =========================
 */
router.post("/", adminAuth, addProduct);
router.delete("/:id", adminAuth, deleteProduct);

module.exports = router;
