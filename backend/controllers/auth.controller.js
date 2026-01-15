const db = require("../config/db");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/mailer");

/* ================= SEND OTP ================= */
exports.sendOtp = async (req, res) => {
  const name = (req.body.name || "User").trim();
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

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
      [name, email, otp]
    );

    return res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("🔥 SEND OTP ERROR:", err.message);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const otp = req.body.otp?.trim();

  if (!email || !otp) {
    return res.status(400).json({ message: "Email & OTP required" });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT id, name, email
      FROM users
      WHERE email = ?
        AND otp = ?
        AND otp_expiry > NOW()
      `,
      [email, otp]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = rows[0];

    await db.query(
      "UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?",
      [user.id]
    );

    // ✅ ADMIN EMAIL CHECK
    const role =
      user.email === process.env.ADMIN_EMAIL ? "admin" : "user";

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role
      }
    });
  } catch (err) {
    console.error("🔥 VERIFY OTP ERROR:", err.message);
    return res.status(500).json({ message: "Login failed" });
  }
};

/* ================= GET ME ================= */
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("🔥 GET ME ERROR:", err.message);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};
