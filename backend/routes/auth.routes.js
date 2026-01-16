const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");

/* =========================
   OTP STORE (IN-MEMORY)
========================= */
const otpStore = new Map();

/* =========================
   SEND OTP (BREVO API)
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
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "JD Login", email: "no-reply@jd.com" },
        to: [{ email }],
        subject: "Your JD Login OTP",
        htmlContent: `
          <h2>JD Login OTP</h2>
          <p>Hello <b>${name}</b>,</p>
          <h1>${otp}</h1>
          <p>Valid for 5 minutes.</p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("❌ Brevo error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* =========================
   VERIFY OTP
========================= */
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore.get(email);

  if (!record) return res.status(400).json({ message: "OTP not found" });
  if (record.expires < Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP expired" });
  }
  if (record.otp !== otp)
    return res.status(400).json({ message: "Invalid OTP" });

  otpStore.delete(email);

  const user = { name: record.name, email, role: "user" };

  const token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ token, user });
});

module.exports = router;
