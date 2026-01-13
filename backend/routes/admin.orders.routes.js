const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const adminOrdersController = require("../controllers/admin.orders.controller");

/* ===============================
   ADMIN ORDER ROUTES
   Base Path: /api/admin/orders
================================ */

/**
 * GET /api/admin/orders
 * Get all orders with items
 */
router.get(
  "/",
  adminAuth,
  adminOrdersController.getAllOrders
);

/**
 * PUT /api/admin/orders/:id/status
 * Update order status (locked transitions)
 */
router.put(
  "/:id/status",
  adminAuth,
  adminOrdersController.updateStatus
);

/**
 * DELETE /api/admin/orders/:id
 * Delete order (admin only)
 */
router.delete(
  "/:id",
  adminAuth,
  adminOrdersController.deleteOrder
);

module.exports = router;
