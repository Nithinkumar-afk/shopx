const nodemailer = require("nodemailer");

/**
 * GMAIL SMTP TRANSPORT
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.MAIL_USER, // ✅ FIXED
    pass: process.env.MAIL_PASS  // ✅ FIXED (App Password)
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * VERIFY SMTP ON STARTUP (IMPORTANT)
 */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email config error:", error.message);
  } else {
    console.log("✅ Email server ready");
  }
});

/**
 * SEND OTP EMAIL
 */
exports.sendOTP = async (to, otp, name = "User") => {
  try {
    await transporter.sendMail({
      from: `"JD Infotech" <${process.env.MAIL_USER}>`,
      to,
      subject: "Your Login OTP",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Hello ${name},</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:4px">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          <br/>
          <p>— JD Infotech</p>
        </div>
      `
    });

    return true;
  } catch (err) {
    console.error("❌ OTP mail failed:", err.message);
    throw err; // IMPORTANT: let controller know it failed
  }
};
