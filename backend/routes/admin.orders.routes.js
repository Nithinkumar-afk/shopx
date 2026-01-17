const express = require("express");
const router = express.Router();

const adminOrdersController = require("../controllers/admin.orders.controller");

/* ===============================
   ADMIN ORDER ROUTES (NO LOGIN)
   Base Path: /api/admin/orders
================================ */

// GET ALL ORDERS WITH ITEMS
router.get("/", adminOrdersController.getAllOrders);

// UPDATE ORDER STATUS
router.put("/:id/status", adminOrdersController.updateStatus);

// DELETE ORDER
router.delete("/:id", adminOrdersController.deleteOrder);

module.exports = router;
