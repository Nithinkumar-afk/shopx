const nodemailer = require("nodemailer");

/* =========================
   GMAIL SMTP (PORT 465 SSL)
========================= */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,              // ✅ IMPORTANT
  secure: true,           // ✅ SSL
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // App password
  },
  connectionTimeout: 20000,
});

/* =========================
   VERIFY ON START
========================= */
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Gmail SMTP verify failed:", err.message);
  } else {
    console.log("✅ Gmail SMTP connected (465 SSL)");
  }
});

/* =========================
   SEND OTP
========================= */
exports.sendOTP = async (to, otp, name = "User") => {
  try {
    console.log("📨 Sending OTP email to:", to);

    const info = await transporter.sendMail({
      from: `"JD Security" <${process.env.MAIL_USER}>`,
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
    console.error("❌ Gmail send failed:", error.message);
    throw new Error("Failed to send OTP email");
  }
};
