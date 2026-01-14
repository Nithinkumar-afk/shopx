const express = require("express");
const router = express.Router();

/**
 * Controllers
 */
const {
  getProducts,
  addProduct,
  deleteProduct,
} = require("../controllers/product.controller");

/**
 * PUBLIC ROUTES
 */
router.get("/", getProducts);

/**
 * ADMIN ROUTES
 */
router.post("/", addProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
