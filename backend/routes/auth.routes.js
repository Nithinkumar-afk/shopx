const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");
const { sendMagicLink } = require("../utils/mailer");

/* =========================
   SAFE ENV CHECK
========================= */
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET missing — auth disabled");
}

/* =========================
   TEST ROUTE
========================= */
router.get("/magic-link", (req, res) => {
  res.json({
    message: "Auth route working ✅ Use POST /magic-link",
  });
});

/* =========================
   SEND MAGIC LINK
========================= */
router.post("/magic-link", async (req, res) => {
  console.log("🟡 /magic-link API hit");

  try {
    if (!process.env.JWT_SECRET || !process.env.FRONTEND_URL) {
      return res.status(500).json({
        message: "Login service unavailable",
      });
    }

    const name = String(req.body.name || "User").trim();
    const email = String(req.body.email || "").trim().toLowerCase();

    // ✅ Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(200).json({
        message: "If the email exists, a login link has been sent",
      });
    }

    // ⏱️ Prevent spam (existing valid token)
    const [existing] = await db.query(
      `SELECT magic_expiry FROM users WHERE email = ?`,
      [email]
    );

    if (
      existing.length &&
      existing[0].magic_expiry &&
      new Date(existing[0].magic_expiry) > new Date()
    ) {
      return res.status(200).json({
        message: "If the email exists, a login link has been sent",
      });
    }

    // 🔐 Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 💾 Store token
    await db.query(
      `
      INSERT INTO users (name, email, magic_token, magic_expiry)
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        magic_token = VALUES(magic_token),
        magic_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
      `,
      [name, email, hashedToken]
    );

    // 🔗 Magic link
    const link = `${process.env.FRONTEND_URL}/magic-login.html?token=${token}&email=${encodeURIComponent(email)}`;

    // 📧 Send mail
    await sendMagicLink(email, link, name);

    console.log("📧 Magic link sent to:", email);

    // ✅ SAME RESPONSE ALWAYS (SECURITY)
    return res.status(200).json({
      message: "If the email exists, a login link has been sent",
    });

  } catch (err) {
    console.error("❌ MAGIC LINK ERROR:", err);
    return res.status(500).json({
      message: "Login service error",
    });
  }
});

/* =========================
   VERIFY MAGIC LINK
========================= */
router.post("/verify-magic", async (req, res) => {
  console.log("🟡 /verify-magic API hit");

  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const token = String(req.body.token || "").trim();

    if (!email || !token) {
      return res.status(400).json({
        message: "Invalid or expired login link",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const [rows] = await db.query(
      `
      SELECT id, name, email
      FROM users
      WHERE email = ?
        AND magic_token = ?
        AND magic_expiry > NOW()
      `,
      [email, hashedToken]
    );

    if (!rows.length) {
      return res.status(400).json({
        message: "Invalid or expired login link",
      });
    }

    const user = rows[0];

    // 🧹 Invalidate token
    await db.query(
      `UPDATE users SET magic_token = NULL, magic_expiry = NULL WHERE id = ?`,
      [user.id]
    );

    // 🔑 JWT
    const jwtToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("❌ VERIFY MAGIC ERROR:", err);
    return res.status(500).json({
      message: "Login failed",
    });
  }
});

module.exports = router;
