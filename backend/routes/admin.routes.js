const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const adminAuth = require("../middleware/adminAuth");

/* =====================
   ADMIN ROUTES
===================== */

router.post("/login", adminController.login);

router.get("/stats", adminAuth, adminController.getStats);

router.get("/recent-orders", adminAuth, adminController.getRecentOrders);

module.exports = router;
