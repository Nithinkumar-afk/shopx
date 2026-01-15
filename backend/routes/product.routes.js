const express = require("express");
const router = express.Router();

const {
  getProducts,
  addProduct,
  deleteProduct
} = require("../controllers/products.controller");

const adminAuth = require("../middleware/adminAuth");

/*
|--------------------------------------------------------------------------
| PUBLIC PRODUCT ROUTES
|--------------------------------------------------------------------------
| Base path: /api/products
| Access: Public
|--------------------------------------------------------------------------
*/
router.get("/", getProducts);

/*
|--------------------------------------------------------------------------
| ADMIN PRODUCT ROUTES
|--------------------------------------------------------------------------
| Base path: /api/products
| Access: Admin Only
|--------------------------------------------------------------------------
*/
router.post("/", adminAuth, addProduct);
router.delete("/:id", adminAuth, deleteProduct);

module.exports = router;
