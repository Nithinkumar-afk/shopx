const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const {
  getCart,
  addToCart,
  updateQty,
  removeItem,
  clearCart
} = require("../controllers/cart.controller");

/* ================= CART ROUTES ================= */
router.get("/", auth, getCart);
router.post("/", auth, addToCart);
router.put("/:productId", auth, updateQty);
router.delete("/:productId", auth, removeItem);
router.delete("/", auth, clearCart);

module.exports = router;
