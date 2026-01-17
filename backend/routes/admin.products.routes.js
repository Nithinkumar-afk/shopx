const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById
} = require("../controllers/product.controller");

/* ===============================
   PRODUCT ROUTES (PUBLIC)
   Base: /api/products
   NO AUTH / NO LOGIN
================================ */

// GET ALL PRODUCTS
router.get("/", getAllProducts);

// GET SINGLE PRODUCT
router.get("/:id", getProductById);

module.exports = router;
