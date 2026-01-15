const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const adminAuth = require("../middleware/adminAuth");

/**
 * ===============================
 * ADMIN AUTH ROUTES
 * ===============================
 */

/**
 * ADMIN LOGIN
 * POST /api/admin/login
 */
router.post("/login", adminController.login);

/**
 * ===============================
 * ADMIN PROTECTED ROUTES
 * ===============================
 */

/**
 * ADMIN DASHBOARD STATS
 * GET /api/admin/stats
 */
router.get("/stats", adminAuth, adminController.getStats);

/**
 * RECENT ORDERS
 * GET /api/admin/recent-orders
 */
router.get("/recent-orders", adminAuth, adminController.getRecentOrders);

module.exports = router;
