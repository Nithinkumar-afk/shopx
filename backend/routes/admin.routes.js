const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin.controller");
const adminAuth = require("../middleware/adminAuth");

router.post("/login", admin.login);
router.get("/stats", adminAuth, admin.getStats);
router.get("/recent-orders", adminAuth, admin.getRecentOrders);

module.exports = router;
