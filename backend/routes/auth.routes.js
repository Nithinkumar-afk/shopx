const router = require("express").Router();
const auth = require("../controllers/auth.controller");
const userAuth = require("../middleware/auth");

/* ===============================
   USER AUTH ROUTES
================================ */

// Send OTP to email
router.post("/send-otp", auth.sendOtp);

// Verify OTP & login
router.post("/verify-otp", auth.verifyOtp);

// Get logged-in user profile
router.get("/me", userAuth, auth.getMe);

module.exports = router;
