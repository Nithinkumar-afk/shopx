const nodemailer = require("nodemailer");

/* =========================
   TRANSPORTER (GMAIL SMTP)
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // your gmail
    pass: process.env.MAIL_PASS, // app password (NOT gmail password)
  },
});

/* =========================
   VERIFY SMTP ON STARTUP
========================= */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Gmail SMTP error:", error.message);
  } else {
    console.log("✅ Gmail SMTP ready to send emails");
  }
});

/* =========================
   SEND OTP EMAIL
========================= */
exports.sendOTP = async (to, otp, name = "User") => {
  try {
    console.log("📨 Sending OTP email to:", to);

    const mailOptions = {
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
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ OTP email sent:", info.messageId);
    return true;

  } catch (error) {
    console.error("❌ Gmail send failed:", error.message);
    throw new Error("Failed to send OTP email");
  }
};
