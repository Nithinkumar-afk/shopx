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
  console.log("🟡 /send-otp API hit");

  try {
    const name = String(req.body.name || "User").trim();
    const email = String(req.body.email || "").trim().toLowerCase();

    // ✅ Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // ⏱️ Prevent OTP spam (30s cooldown)
    const [existing] = await db.query(
      `SELECT otp_expiry FROM users WHERE email = ?`,
      [email]
    );

    if (
      existing.length &&
      existing[0].otp_expiry &&
      new Date(existing[0].otp_expiry) > new Date()
    ) {
      return res.status(429).json({
        message: "Please wait before requesting another OTP",
      });
    }

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 8);

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

    // 📧 Send Email (MANDATORY SUCCESS)
    await sendOTP(email, otp, name);
    console.log("📧 OTP email sent to:", email);

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
  console.log("🟡 /verify-otp API hit");

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

    // 🔑 JWT
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
