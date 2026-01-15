const express = require("express");
const router = express.Router();

const {
  addProduct,
  deleteProduct,
} = require("../controllers/products.controller");

const adminAuth = require("../middleware/adminAuth");

router.post("/", adminAuth, addProduct);
router.delete("/:id", adminAuth, deleteProduct);

module.exports = router;
