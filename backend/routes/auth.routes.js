const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const checkEnv = require("../utils/envCheck");

const router = express.Router();

router.post("/magic-login", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Missing name or email" });
  }

  const ok = checkEnv([
    "JWT_SECRET",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "FRONTEND_URL",
  ]);

  if (!ok) {
    return res.status(500).json({ message: "Server misconfigured" });
  }

  try {
    const token = jwt.sign(
      { name, email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const link = `${process.env.FRONTEND_URL}/magic-login.html?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
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
        <h2>Hello ${name}</h2>
        <p>Click below to login:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({ message: "Magic link sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Email failed" });
  }
});

module.exports = router;
