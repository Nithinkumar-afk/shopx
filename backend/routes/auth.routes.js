const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

/* =========================
   TEMP OTP STORE (IN-MEMORY)
========================= */
const otpStore = new Map();

/* =========================
   EMAIL TRANSPORT (GMAIL)
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =========================
   SEND OTP
   POST /api/auth/send-otp
========================= */
router.post("/send-otp", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    otp,
    expires: Date.now() + 5 * 60 * 1000,
    name,
  });

  try {
    await transporter.sendMail({
      from: `"JD Login" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your JD Login OTP",
      html: `
        <div style="font-family:Arial">
          <h2>JD Login OTP</h2>
          <p>Hello <b>${name}</b>,</p>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:4px">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* =========================
   VERIFY OTP
   POST /api/auth/verify-otp
========================= */
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

  const user = {
    name: record.name,
    email,
    role: "user",
  };

  const token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ token, user });
});

module.exports = router;
