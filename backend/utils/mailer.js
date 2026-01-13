const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  pool: true,           // 🔥 keeps connection alive
  maxConnections: 5,
  maxMessages: 100
});

exports.sendOTP = async (to, otp) => {
  await transporter.sendMail({
    from: `"JD Infotech" <${process.env.MAIL_USER}>`,
    to,
    subject: "Your JD Infotech Login OTP",
    priority: "high",   // ⚡ FAST DELIVERY
    headers: {
      "X-Priority": "1",
      "X-Mailer": "ShopX Mailer"
    },
    html: `
      <h2>JD Infotech OTP</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>Valid for 5 minutes</p>
    `
  });
};
