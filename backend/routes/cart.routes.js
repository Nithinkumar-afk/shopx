const express = require("express");
const router = express.Router();

const userAuth = require("../middleware/user.auth.middleware");
const {
  getCart,
  addToCart,
  updateQty,
  removeItem,
  clearCart
} = require("../controllers/cart.controller");

/* ================= CART ROUTES ================= */
router.get("/", userAuth, getCart);
router.post("/", userAuth, addToCart);
router.put("/:productId", userAuth, updateQty);
router.delete("/:productId", userAuth, removeItem);
router.delete("/", userAuth, clearCart);

module.exports = router;
