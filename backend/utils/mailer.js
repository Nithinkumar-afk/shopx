const nodemailer = require("nodemailer");

/**
 * REQUIRED ENV CHECK
 */
if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.warn("⚠️ MAIL_USER or MAIL_PASS missing in environment");
}

/**
 * SMTP TRANSPORT (GMAIL)
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password
  },
});

/**
 * VERIFY SMTP (NON-BLOCKING)
 */
transporter.verify()
  .then(() => {
    console.log("✅ SMTP ready (Gmail)");
  })
  .catch((err) => {
    console.error("❌ SMTP VERIFY FAILED:", err.message);
  });

/**
 * SEND OTP EMAIL
 */
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
        <div style="font-family: Arial, sans-serif;">
          <h2>Hello ${name},</h2>
          <p>Your One-Time Password is:</p>
          <h1 style="letter-spacing:4px;">${otp}</h1>
          <p><b>Valid for 5 minutes</b></p>
          <hr/>
          <small>JD Infotech Security System</small>
        </div>
      `,
    });

    console.log(`📧 OTP sent to ${to}`);
  } catch (err) {
    console.error("❌ OTP MAIL FAILED:", err);
    throw new Error("Email sending failed");
  }
};
