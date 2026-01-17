const express = require("express");
const router = express.Router();

/* =====================================================
   IMPORT CONTROLLER (EXACT FILE NAME)
===================================================== */
const adminProductsController = require(
  "../controllers/admin.products.controller.js"
);

/* =====================================================
   ADMIN PRODUCT ROUTES
   Base: /api/admin/products
   NO LOGIN / NO AUTH
===================================================== */

// ADD PRODUCT
router.post(
  "/",
  adminProductsController.addProduct
);

// DELETE PRODUCT
router.delete(
  "/:id",
  adminProductsController.deleteProduct
);

module.exports = router;
