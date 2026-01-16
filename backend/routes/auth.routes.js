const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { sendOTP } = require("../utils/mailer");

/* =========================
   TEST ROUTE
========================= */
router.get("/send-otp", (req, res) => {
  res.json({
    message: "Auth route is working ✅. Use POST to send OTP.",
  });
});

/* =========================
   SEND OTP
========================= */
router.post("/send-otp", async (req, res) => {
  try {
    const name = String(req.body.name || "User").trim();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await sendOTP(email, otp, name);

    await db.query(
      `
      INSERT INTO users (name, email, otp, otp_expiry)
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        otp = VALUES(otp),
        otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      `,
      [name, email, hashedOtp]
    );

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ SEND OTP ERROR:", err.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* =========================
   VERIFY OTP
========================= */
router.post("/verify-otp", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ message: "Email & OTP required" });
    }

    const [rows] = await db.query(
      `
      SELECT id, name, email, otp
      FROM users
      WHERE email = ?
        AND otp IS NOT NULL
        AND otp_expiry > NOW()
      `,
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(otp, user.otp);

    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await db.query(
      "UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?",
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, role: "user" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "user",
      },
    });
  } catch (err) {
    console.error("❌ VERIFY OTP ERROR:", err.message);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
