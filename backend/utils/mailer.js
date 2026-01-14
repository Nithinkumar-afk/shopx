const nodemailer = require("nodemailer");

if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.error("❌ MAIL_USER or MAIL_PASS missing");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify once
transporter.verify((err) => {
  if (err) {
    console.error("❌ Mailer init failed:", err);
  } else {
    console.log("📧 Mailer initialized");
  }
});

exports.sendOTP = async (to, otp, name = "User") => {
  await transporter.sendMail({
    from: `"JD Infotech" <${process.env.MAIL_USER}>`,
    to,
    subject: "Your JD Infotech Login OTP",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial">
        <h2>Hello ${name},</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      </div>
    `
  });
};
