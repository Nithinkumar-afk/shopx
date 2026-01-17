const express = require("express");
const router = express.Router();

const {
  addProduct,
  deleteProduct
} = require("../controllers/admin.products.controller");

/*
|------------------------------------------------------------------
| ADMIN PRODUCT ROUTES (NO LOGIN)
| Base: /api/admin/products
|------------------------------------------------------------------
*/

// ADD PRODUCT
router.post("/", addProduct);

// DELETE PRODUCT
router.delete("/:id", deleteProduct);

module.exports = router;
