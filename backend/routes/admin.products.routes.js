const express = require("express");
const router = express.Router();

const {
  addProduct,
  deleteProduct
} = require("../controllers/admin.products.controller");

const adminAuth = require("../middleware/adminAuth");

/*
|--------------------------------------------------------------------------
| ADMIN PRODUCT ROUTES
|--------------------------------------------------------------------------
| Base: /api/admin/products
| Auth: Admin JWT required
|--------------------------------------------------------------------------
*/

router.post("/", adminAuth, addProduct);
router.delete("/:id", adminAuth, deleteProduct);

module.exports = router;
