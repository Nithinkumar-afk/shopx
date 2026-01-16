const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendOTP } = require("../utils/mailer");

/* ===============================
   HELPER: JWT SIGN
================================ */
function signToken(payload, expiresIn = "7d") {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing in ENV");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/* ===============================
   SEND OTP
================================ */
exports.sendOtp = async (req, res) => {
  try {
    const name = String(req.body.name || "User").trim();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length) {
      await db.query(
        `UPDATE users 
         SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
         WHERE email = ?`,
        [hashedOtp, email]
      );
    } else {
      await db.query(
        `INSERT INTO users (name, email, otp, otp_expiry)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
        [name, email, hashedOtp]
      );
    }

    res.json({ message: "OTP sent successfully" });

    sendOTP(email, otp, name).catch(err =>
      console.error("OTP mail failed:", err.message)
    );

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

/* ===============================
   VERIFY OTP
================================ */
exports.verifyOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ message: "Email & OTP required" });
    }

    const [rows] = await db.query(
      `SELECT id, name, email, otp
       FROM users
       WHERE email = ?
         AND otp IS NOT NULL
         AND otp_expiry > NOW()`,
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(otp, user.otp);

    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await db.query(
      "UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?",
      [user.id]
    );

    const token = signToken({ id: user.id, role: "user" });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "user",
      },
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

/* ===============================
   ADMIN LOGIN
================================ */
exports.adminLogin = (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USER ||
    password !== process.env.ADMIN_PASS
  ) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const token = signToken({ id: 0, role: "admin" }, "1d");
  res.json({ token });
};
