const express = require("express");
const router = express.Router();

const auth = require("../controllers/auth.controller");
const userAuth = require("../middleware/auth.middleware");

/* ===============================
   USER AUTH ROUTES
================================ */

// Send OTP
router.post("/send-otp", auth.sendOtp);

// Verify OTP & login
router.post("/verify-otp", auth.verifyOtp);

// Get logged-in user
router.get("/me", userAuth, auth.getMe);

/* ===============================
   ADMIN AUTH ROUTES ✅ FIX
================================ */

// ADMIN LOGIN (USERNAME + PASSWORD ONLY)
router.post("/admin/login", auth.adminLogin);

module.exports = router;
