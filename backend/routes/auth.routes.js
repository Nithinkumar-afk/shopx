const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const auth = require("../middleware/userAuth");

// AUTH ROUTES
router.post("/send-otp", authController.sendOtp);   // ✅ FIX ADDED
router.post("/verify-otp", authController.verifyOtp);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", auth, authController.logout);

module.exports = router;
