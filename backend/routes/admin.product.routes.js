const express = require("express");
const router = express.Router();

const {
  addProduct,
  deleteProduct
} = require("../controllers/product.controller");

const auth = require("../middleware/auth.middleware");

/* ================= ADMIN PRODUCT ROUTES ================= */
router.post("/", auth, addProduct);
router.delete("/:id", auth, deleteProduct);

module.exports = router;
