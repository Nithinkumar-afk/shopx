const db = require("../config/db");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/mailer");

/* ================= SEND OTP ================= */
exports.sendOtp = async (req, res) => {
  const { name = "User", email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await db.query(
      `
      INSERT INTO users (name, email, otp, otp_expiry)
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        otp = VALUES(otp),
        otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      `,
      [name.trim(), email.trim().toLowerCase(), otp]
    );

    const sent = await sendOTP(email, otp, name);

    if (!sent) {
      return res.status(500).json({ message: "OTP email failed" });
    }

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

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
      [email.trim().toLowerCase(), otp.trim()]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = rows[0];

    await db.query(
      "UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?",
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "Login failed" });
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

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};
