const express = require("express");
const router = express.Router();

const auth = require("../middleware/userAuth"); // ✅ CORRECT
const ordersController = require("../controllers/orders.controller");

// PLACE ORDER
router.post("/", auth, ordersController.placeOrder);

// GET USER ORDERS
router.get("/", auth, ordersController.getUserOrders);

// GET LATEST ORDER
router.get("/latest", auth, ordersController.getLatestOrder);

// CANCEL ORDER
router.put("/:id/cancel", auth, ordersController.cancelOrder);

module.exports = router;
