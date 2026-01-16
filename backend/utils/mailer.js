const nodemailer = require("nodemailer");

/* =================================================
   SAFE ENV CHECK
================================================= */
if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.warn("⚠️ MAIL_USER or MAIL_PASS missing (email disabled)");
}

/* =================================================
   RAILWAY SAFE SMTP (GMAIL)
   ✅ Port 587
   ✅ STARTTLS
   ✅ FAST
================================================= */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,          // ✅ MUST BE 587 (NOT 465)
  secure: false,      // ✅ REQUIRED for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

/* =================================================
   SEND OTP EMAIL
================================================= */
exports.sendOTP = async (to, otp, name = "User") => {
  if (!to || !otp) {
    throw new Error("Missing email or OTP");
  }

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

  console.log(`📧 OTP sent to ${to}`);
};
