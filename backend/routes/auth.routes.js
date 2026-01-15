const nodemailer = require("nodemailer");

/**
 * Gmail SMTP transporter
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send OTP Email
 * MUST NEVER CRASH LOGIN FLOW
 */
exports.sendOTP = async (to, otp, name = "User") => {
  try {
    await transporter.sendMail({
      from: `"JD Infotech" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Your Login OTP",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Hello ${name},</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:2px">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          <br/>
          <p>— JD Infotech</p>
        </div>
      `,
    });

    console.log("✅ OTP email sent to:", to);
    return true;

  } catch (err) {
    console.error("❌ OTP mail failed:", err.message);

    // IMPORTANT: DO NOT BLOCK LOGIN
    return true;
  }
};
