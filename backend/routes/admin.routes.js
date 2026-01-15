const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

/**
 * ADMIN LOGIN
 * username: admin
 * password: admin123
 */
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // 🔍 DEBUG (Railway logs will show this)
  console.log("ADMIN LOGIN BODY:", req.body);

  if (!username || !password) {
    return res.status(400).json({
      message: "Missing credentials"
    });
  }

  // ✅ SIMPLE HARD-CODED ADMIN
  if (username !== "admin" || password !== "admin123") {
    return res.status(401).json({
      message: "Invalid admin credentials"
    });
  }

  // ✅ CREATE TOKEN
  const token = jwt.sign(
    {
      role: "admin",
      username: "admin"
    },
    process.env.JWT_SECRET || "supersecret",
    { expiresIn: "1d" }
  );

  return res.json({
    message: "Admin login successful",
    token
  });
});

module.exports = router;
