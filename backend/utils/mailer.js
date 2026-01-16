const nodemailer = require("nodemailer");

/* ============================
   ENV CHECK
============================ */
if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.warn("⚠️ MAIL_USER or MAIL_PASS missing in Railway ENV");
}

/* ============================
   SMTP TRANSPORT (RAILWAY SAFE)
============================ */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,              // ✅ safer for Railway
  secure: false,          // ❗ must be false for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password
  },
  connectionTimeout: 10000, // 10s
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/* ============================
   VERIFY SMTP (IMPORTANT)
============================ */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP VERIFY FAILED:", error.message);
  } else {
    console.log("✅ SMTP READY TO SEND EMAILS");
  }
});

/* ============================
   SEND OTP EMAIL
============================ */
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
    console.error("❌ OTP MAIL FAILED:", err);
    throw new Error("Email sending failed");
  }
};
