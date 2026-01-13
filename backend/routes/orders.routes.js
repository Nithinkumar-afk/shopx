const express = require("express");
const router = express.Router();

const auth = require("../middleware/userAuth");
const ordersController = require("../controllers/orders.controller");

// ✅ PLACE ORDER
router.post("/", auth, ordersController.placeOrder);
// Get last order of logged-in user
router.get("/latest", auth, ordersController.getLatestOrder);

// ✅ GET USER ORDERS
router.get("/", auth, ordersController.getUserOrders);

// ✅ CANCEL ORDER
router.put("/:id/cancel", auth, ordersController.cancelOrder);
// Get last order of logged-in user

module.exports = router;
