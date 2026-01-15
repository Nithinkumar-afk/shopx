const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

/**
 * AUTH ROUTES
 */

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Profile (protected)
router.get("/profile", authMiddleware, getProfile);

module.exports = router;
