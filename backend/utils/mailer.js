const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

exports.sendOTP = async (to, otp, name = "User") => {
  try {
    await transporter.sendMail({
      from: `"JD Infotech" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Your Login OTP",
      html: `
        <h2>Hello ${name},</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      `
    });
    return true;
  } catch (err) {
    console.error("OTP mail failed:", err.message);
    return false;
  }
};
