const nodemailer = require("nodemailer");

if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.error("❌ MAIL_USER or MAIL_PASS missing");
}

/* ================= TRANSPORT ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ================= VERIFY ================= */
transporter.verify((err) => {
  if (err) {
    console.error("❌ Mailer init failed:", err.message);
  } else {
    console.log("📧 Gmail SMTP mailer ready");
  }
});

/* ================= SEND OTP ================= */
exports.sendOTP = async (to, otp, name = "User") => {
  try {
    await transporter.sendMail({
      from: `"JD Infotech" <${process.env.MAIL_USER}>`,
      to,
      subject: "Your Login OTP",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family:Arial">
          <h2>Hello ${name},</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>Valid for 5 minutes</p>
        </div>
      `,
    });

    console.log("📨 OTP email sent to:", to);
    return true;
  } catch (err) {
    console.error("❌ OTP mail failed:", err.message);
    return false;
  }
};
