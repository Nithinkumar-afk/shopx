const nodemailer = require("nodemailer");

/* =========================
   BREVO SMTP CONFIG
========================= */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,          // MUST be smtp-relay.brevo.com
  port: Number(process.env.MAIL_PORT),  // 587
  secure: false,                        // STARTTLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Railway safe
  },
  connectionTimeout: 20000,
});

/* =========================
   VERIFY SMTP
========================= */
transporter.verify((err) => {
  if (err) {
    console.error("❌ Brevo SMTP verify failed:", err.message);
  } else {
    console.log("✅ Brevo SMTP connected");
  }
});

/* =========================
   SEND OTP
========================= */
exports.sendOTP = async (to, otp, name = "User") => {
  try {
    console.log("📨 Sending OTP email to:", to);

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: "Your JD Login OTP",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Hello ${name},</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:4px">${otp}</h1>
          <p>Valid for 5 minutes.</p>
          <hr/>
          <small>JD Security System</small>
        </div>
      `,
    });

    console.log("✅ OTP email sent:", info.messageId);
    return true;

  } catch (err) {
    console.error("❌ Brevo send failed:", err.message);
    throw new Error("Failed to send OTP email");
  }
};
