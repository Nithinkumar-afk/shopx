const express = require("express");
const router = express.Router();

const auth = require("../controllers/auth.controller");
const userAuth = require("../middleware/auth.middleware");

/* ===============================
   USER AUTH ROUTES
================================ */

// Send OTP to email
router.post("/send-otp", async (req, res, next) => {
  try {
    await auth.sendOtp(req, res);
  } catch (err) {
    next(err);
  }
});

// Verify OTP & login
router.post("/verify-otp", async (req, res, next) => {
  try {
    await auth.verifyOtp(req, res);
  } catch (err) {
    next(err);
  }
});

// Get logged-in user profile
router.get("/me", userAuth, async (req, res, next) => {
  try {
    await auth.getMe(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
