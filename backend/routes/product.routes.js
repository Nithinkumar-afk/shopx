const express = require("express");
const router = express.Router();

const {
  getProducts,
  addProduct,
  deleteProduct
} = require("../controllers/product.controller");

// PUBLIC
router.get("/", getProducts);

// ADMIN
router.post("/", addProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
