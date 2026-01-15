const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// TEMP STORE (replace with DB later)
const otpStore = new Map();

/**
 * SEND OTP
 * POST /api/auth/send-otp
 */
router.post("/send-otp", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email required" });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP (5 min expiry)
  otpStore.set(email, {
    otp,
    expires: Date.now() + 5 * 60 * 1000,
    name,
  });

  console.log("📩 OTP:", otp, "for", email); // (email service later)

  res.json({ message: "OTP sent successfully" });
});

/**
 * VERIFY OTP
 * POST /api/auth/verify-otp
 */
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ message: "OTP not found" });
  }

  if (record.expires < Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP expired" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  otpStore.delete(email);

  const user = {
    name: record.name,
    email,
    role: "user",
  };

  const token = jwt.sign(user, process.env.JWT_SECRET || "secret123", {
    expiresIn: "7d",
  });

  res.json({
    message: "Login successful",
    token,
    user,
  });
});

module.exports = router;
