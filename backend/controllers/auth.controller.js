const db = require("../config/db");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/mailer");

/* ================= REGISTER (SEND OTP) ================= */
exports.register = async (req, res) => {
  return exports.sendOtp(req, res);
};

/* ================= LOGIN (SEND OTP) ================= */
exports.login = async (req, res) => {
  return exports.sendOtp(req, res);
};

/* ================= SEND OTP ================= */
exports.sendOtp = async (req, res) => {
  const { name, email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const userName = name?.trim() || "User";
  const cleanEmail = email.trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await db.query(
      `
      INSERT INTO users (name, email, otp, otp_expiry)
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        otp = VALUES(otp),
        otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      `,
      [userName, cleanEmail, otp]
    );

    /* ✅ FAST UX FIX (non-blocking mail) */
    sendOTP(cleanEmail, otp).catch(err =>
      console.error("MAIL ERROR:", err)
    );

    /* ✅ Respond immediately */
    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP required" });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT * FROM users
      WHERE email = ?
        AND otp = ?
        AND otp_expiry > NOW()
      `,
      [email.trim(), otp.trim()]
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
      { id: user.id, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= LOGOUT ================= */
exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};
