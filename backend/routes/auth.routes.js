const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const router = express.Router();

/* ===============================
   MAGIC LINK SEND
================================ */
router.post("/magic-login", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Missing name or email" });
  }

  try {
    const token = jwt.sign(
      { name, email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const link = `${process.env.FRONTEND_URL}/verify.html?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"JD Login" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your JD Magic Login Link",
      html: `
        <h3>Hello ${name}</h3>
        <p>Click the link below to login:</p>
        <a href="${link}">${link}</a>
        <p><strong>Valid for 15 minutes</strong></p>
      `,
    });

    res.json({ message: "Magic link sent successfully" });

  } catch (err) {
    console.error("🔥 Magic link error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

/* ===============================
   VERIFY TOKEN
================================ */
router.get("/verify", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const loginToken = jwt.sign(
      { email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: loginToken,
      user: decoded,
    });

  } catch (err) {
    console.error("🔥 Token verify error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
