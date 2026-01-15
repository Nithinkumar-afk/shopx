const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const adminOrdersController = require("../controllers/admin.orders.controller");

/**
 * ===============================
 * ADMIN DASHBOARD ROUTES
 * Base: /api/admin
 * ===============================
 */

/**
 * GET /api/admin/dashboard
 * Returns:
 *  - totalOrders
 *  - totalRevenue
 *  - totalUsers
 */
router.get(
  "/dashboard",
  adminAuth,
  adminOrdersController.getDashboardStats
);

module.exports = router;
