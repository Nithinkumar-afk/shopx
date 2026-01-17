const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  updateQty,
  removeItem,
  clearCart
} = require("../controllers/cart.controller");

/* ================= CART ROUTES (NO AUTH) ================= */

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:productId", updateQty);
router.delete("/:productId", removeItem);
router.delete("/", clearCart);

module.exports = router;
