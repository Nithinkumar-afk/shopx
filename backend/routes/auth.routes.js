const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");
const { sendMagicLink } = require("../utils/mailer");

/* =========================
   SEND MAGIC LINK
========================= */
router.post("/magic-link", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!process.env.JWT_SECRET || !process.env.FRONTEND_URL) {
      console.error("❌ ENV missing");
      return res.status(500).json({ message: "Server configuration error" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name || "User").trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.json({ message: "If the email exists, a link was sent" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await db.query(
      `
      INSERT INTO users (name, email, magic_token, magic_expiry)
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        magic_token = VALUES(magic_token),
        magic_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
      `,
      [cleanName, cleanEmail, hashedToken]
    );

    const link = `${process.env.FRONTEND_URL}/magic-login.html?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    await sendMagicLink(cleanEmail, link, cleanName);

    return res.json({ message: "Magic link sent" });

  } catch (err) {
    console.error("🔥 MAGIC LINK ERROR:", err);
    return res.status(500).json({ message: "Failed to send magic link" });
  }
});

/* =========================
   VERIFY MAGIC LINK
========================= */
router.post("/verify-magic", async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ message: "Invalid request" });
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
      [email.toLowerCase(), hashedToken]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Invalid or expired link" });
    }

    const user = rows[0];

    await db.query(
      `UPDATE users SET magic_token=NULL, magic_expiry=NULL WHERE id=?`,
      [user.id]
    );

    const jwtToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token: jwtToken, user });

  } catch (err) {
    console.error("🔥 VERIFY ERROR:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
