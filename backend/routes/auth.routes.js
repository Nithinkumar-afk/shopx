const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const router = express.Router();

/* ===============================
   OTP STORE (in-memory)
================================ */
const otpStore = new Map();

/* ===============================
   EMAIL TRANSPORTER
================================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ===============================
   SEND OTP
   POST /api/auth/send-otp
================================ */
router.post("/send-otp", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    otp,
    expires: Date.now() + 5 * 60 * 1000, // 5 min
    name,
  });

  try {
    await transporter.sendMail({
      from: `"JD Login" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your JD Login OTP",
      html: `
        <h2>JD Login OTP</h2>
        <p>Hello <b>${name}</b>,</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      `,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* ===============================
   VERIFY OTP
   POST /api/auth/verify-otp
================================ */
router.post("/verify-otp", (req, res) => {
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

  const token = jwt.sign(
    {
      name: record.name,
      email,
      role: "user",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Login successful",
    token,
    user: {
      name: record.name,
      email,
      role: "user",
    },
  });
});

module.exports = router;
