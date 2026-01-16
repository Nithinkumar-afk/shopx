const nodemailer = require("nodemailer");

/* =================================================
   ENV CHECK (DO NOT CRASH APP)
================================================= */
if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.warn("⚠️ MAIL_USER or MAIL_PASS missing (email disabled)");
}

/* =================================================
   RAILWAY + GMAIL SAFE SMTP (RECOMMENDED)
   ✅ Port 587 (STARTTLS)
   ✅ secure = false
   ✅ Longer timeouts
================================================= */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,          // ✅ FIXED
  secure: false,      // ✅ MUST be false for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password ONLY
  },
  connectionTimeout: 30000,
  socketTimeout: 30000,
  tls: {
    rejectUnauthorized: false, // ✅ Railway-safe
  },
});

/* =================================================
   SEND OTP EMAIL
================================================= */
exports.sendOTP = async (to, otp, name = "User") => {
  if (!to || !otp) {
    throw new Error("Missing email or OTP");
  }

  try {
    await transporter.sendMail({
      from: `"JD Infotech" <${process.env.MAIL_USER}>`,
      to,
      subject: "Your Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding:10px">
          <h2>Hello ${name},</h2>
          <p>Your One-Time Password (OTP):</p>
          <h1 style="letter-spacing:4px;">${otp}</h1>
          <p><b>Valid for 5 minutes</b></p>
          <hr/>
          <small>JD Infotech Security System</small>
        </div>
      `,
    });

    console.log(`📧 OTP sent successfully to ${to}`);
  } catch (err) {
    console.error("❌ OTP MAIL FAILED:", err); // FULL ERROR
    throw err; // Let route handle fallback
  }
};
