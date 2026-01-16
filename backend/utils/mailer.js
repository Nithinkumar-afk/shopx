const nodemailer = require("nodemailer");

/**
 * Gmail SMTP Transporter
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,   // 👈 MENTIONED HERE
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send OTP Email
 */
exports.sendOTP = async (to, otp, name = "User") => {
  try {
    console.log("📨 Sending OTP to:", to);

    const info = await transporter.sendMail({
      from: `"JD Security" <${process.env.MAIL_USER}>`, // 👈 AND HERE
      to,
      subject: "Your JD Login OTP",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Hello ${name},</h2>
          <p>Your login OTP is:</p>
          <h1 style="letter-spacing:4px">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          <p>If you didn’t request this, ignore this email.</p>
          <hr/>
          <small>JD Security System</small>
        </div>
      `,
    });

    console.log("✅ OTP email sent:", info.messageId);
    return true;

  } catch (error) {
    console.error("❌ Gmail OTP failed:", error);
    throw new Error("Failed to send OTP email");
  }
};
