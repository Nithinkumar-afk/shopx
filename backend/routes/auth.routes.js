const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

/**
 * USER AUTH ROUTES
 * Base: /api/auth
 */

// REGISTER
router.post("/register", authController.register);

// LOGIN
router.post("/login", authController.login);

module.exports = router; // ✅ MUST EXPORT ROUTER
