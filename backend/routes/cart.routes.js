const express = require("express");
const router = express.Router();

const auth = require("../middleware/userAuth");
const cart = require("../controllers/cart.controller");

/* CART ROUTES */
router.get("/", auth, cart.getCart);
router.post("/", auth, cart.addToCart);
router.put("/:productId", auth, cart.updateQty);
router.delete("/:productId", auth, cart.removeItem);
router.delete("/", auth, cart.clearCart);

module.exports = router;
