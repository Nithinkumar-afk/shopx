const nodemailer = require("nodemailer");

/* =================================================
   ENV CHECK (DO NOT CRASH APP)
================================================= */
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;

if (!MAIL_USER || !MAIL_PASS) {
  console.warn("⚠️ MAIL_USER or MAIL_PASS missing — OTP emails disabled");
}

/* =================================================
   SMTP TRANSPORT (GMAIL – RAILWAY SAFE)
================================================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: MAIL_USER && MAIL_PASS ? {
    user: MAIL_USER,
    pass: MAIL_PASS, // Gmail App Password
  } : undefined,

  // ⏱️ HARD TIMEOUTS (VERY IMPORTANT)
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

/* =================================================
   SEND OTP EMAIL (FAIL-SAFE)
================================================= */
exports.sendOTP = async (to, otp, name = "User") => {
  // 🚫 Skip email if SMTP not configured
  if (!MAIL_USER || !MAIL_PASS) {
    console.warn("⚠️ SMTP skipped (env missing)");
    return;
  }

  if (!to || !otp) {
    throw new Error("Missing email or OTP");
  }

  try {
    await transporter.sendMail({
      from: `"JD Infotech" <${MAIL_USER}>`,
      to,
      subject: "Your Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Hello ${name},</h2>
          <p>Your One-Time Password is:</p>
          <h1 style="letter-spacing:4px;">${otp}</h1>
          <p><b>Valid for 5 minutes</b></p>
          <hr/>
          <small>JD Infotech Security System</small>
        </div>
      `,
    });

    console.log(`📧 OTP email sent → ${to}`);
  } catch (err) {
    // ❌ DO NOT CRASH SERVER
    console.error("⚠️ OTP EMAIL FAILED:", err.message);
    throw err;
  }
};
