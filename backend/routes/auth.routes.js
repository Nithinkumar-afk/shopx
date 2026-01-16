const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { sendOTP } = require("../utils/mailer");

/* =========================
   ENV CHECK
========================= */
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET missing in .env");
  process.exit(1);
}

/* =========================
   TEST ROUTE
========================= */
router.get("/send-otp", (req, res) => {
  res.json({
    message: "Auth route working ✅ Use POST /send-otp",
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
      return res.status(400).json({ message: "Email is required" });
    }

    // 🔐 Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 8); // ⚡ faster for OTP

    // 💾 Save OTP
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

    // 📧 Send Email
    try {
      await sendOTP(email, otp, name);
      console.log("📧 OTP email sent to:", email);
    } catch (mailErr) {
      console.error("⚠️ Email failed:", mailErr.message);
      console.log("🔐 OTP (DEV ONLY):", otp); // REMOVE IN PROD
    }

    return res.status(200).json({
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("❌ SEND OTP ERROR:", err);
    return res.status(500).json({
      message: "Failed to send OTP",
    });
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
      return res.status(400).json({
        message: "Email and OTP are required",
      });
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
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // 🧹 Clear OTP
    await db.query(
      `UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?`,
      [user.id]
    );

    // 🔑 Create JWT
    const token = jwt.sign(
      { id: user.id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("❌ VERIFY OTP ERROR:", err);
    return res.status(500).json({
      message: "OTP verification failed",
    });
  }
});

module.exports = router;
