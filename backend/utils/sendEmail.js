const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
});

async function sendOTPEmail(to, otp) {
  const mailOptions = {
    from: `"JD Shop" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Login OTP",
    html: `
      <h2>JD Login OTP</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendOTPEmail;
