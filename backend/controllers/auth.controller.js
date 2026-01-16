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

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    let emailSent = false;

    /* ===== SEND EMAIL (NON-BLOCKING) ===== */
    try {
      await sendOTP(email, otp, name);
      emailSent = true;
      console.log("✅ OTP email sent:", email);
    } catch (mailErr) {
      console.error("⚠️ OTP email failed:", mailErr.message);
    }

    /* ===== STORE OTP (invalidate old OTP) ===== */
    await db.query(
      `
      INSERT INTO users (name, email, otp, otp_expiry)
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        otp = VALUES(otp),
        otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      `,
      [name, email, hashedOtp]
    );

    return res.json({
      message: emailSent
        ? "OTP sent successfully"
        : "OTP generated, email delivery pending",
    });
  } catch (err) {
    console.error("❌ SEND OTP ERROR:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
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
      `
      SELECT id, name, email, otp
      FROM users
      WHERE email = ?
        AND otp IS NOT NULL
        AND otp_expiry > NOW()
      `,
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(otp, user.otp);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 🔒 Clear OTP after success
    await db.query(
      "UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?",
      [user.id]
    );

    const token = signToken({ id: user.id, role: "user" });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "user",
      },
    });
  } catch (err) {
    console.error("❌ VERIFY OTP ERROR:", err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};

/* ===============================
   GET CURRENT USER
================================ */
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
    console.error("❌ GET ME ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch user" });
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

  return res.json({ token });
};

/* ===============================
   REGISTER (PASSWORD)
================================ */
exports.register = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const [exists] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (exists.length) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    return res.status(500).json({ message: "Register failed" });
  }
};

/* ===============================
   LOGIN (PASSWORD)
================================ */
exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    if (!user.password) {
      return res.status(400).json({ message: "Use OTP login" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({ id: user.id, role: "user" });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    return res.status(500).json({ message: "Login failed" });
  }
};
