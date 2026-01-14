const db = require("../config/db");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/mailer");

/* ================= SEND OTP ================= */
exports.sendOtp = async (req, res) => {
  let { name, email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  if (!db) {
    return res.status(500).json({ message: "Database not connected" });
  }

  const userName = (name || "User").trim();
  const cleanEmail = email.trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Save OTP
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

    console.log("🔐 OTP GENERATED:", cleanEmail, otp); // TEMP DEBUG

    // 🚨 MUST succeed or throw
    const mailResult = await sendOTP(cleanEmail, otp, userName);

    if (!mailResult) {
      throw new Error("Mailer did not confirm delivery");
    }

    return res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("❌ SEND OTP ERROR:", err.message);
    return res.status(500).json({
      message: "Failed to send OTP"
    });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  let { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP required" });
  }

  if (!db) {
    return res.status(500).json({ message: "Database not connected" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  try {
    const [rows] = await db.query(
      `
      SELECT id, name, email
      FROM users
      WHERE email = ?
        AND otp = ?
        AND otp_expiry > NOW()
      `,
      [cleanEmail, cleanOtp]
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
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, user });

  } catch (err) {
    console.error("❌ VERIFY OTP ERROR:", err.message);
    return res.status(500).json({ message: "Login failed" });
  }
};

/* ================= GET LOGGED IN USER ================= */
exports.getMe = async (req, res) => {
  if (!db) {
    return res.status(500).json({ message: "Database not connected" });
  }

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
    console.error("❌ GET ME ERROR:", err.message);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};
