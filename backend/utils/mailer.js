const nodemailer = require("nodemailer");

/**
 * SMTP TRANSPORT
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password
  },
});

/**
 * VERIFY SMTP (only once)
 */
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP ERROR:", error.message);
  } else {
    console.log("✅ SMTP ready (Gmail)");
  }
});

/**
 * SEND OTP MAIL
 */
exports.sendOTP = async (to, otp, name = "User") => {
  try {
    await transporter.sendMail({
      from: `"JD Infotech" <${process.env.MAIL_USER}>`,
      to,
      subject: "Your Login OTP",
      html: `
        <div style="font-family:Arial">
          <h2>Hello ${name},</h2>
          <h1 style="letter-spacing:4px">${otp}</h1>
          <p>OTP valid for 5 minutes</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("❌ OTP MAIL FAILED:", err.message);
    throw new Error("Email sending failed");
  }
};
