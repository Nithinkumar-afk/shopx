const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/* VERIFY SMTP */
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email config error:", error.message);
  } else {
    console.log("✅ Email server ready");
  }
});

/* SEND OTP */
exports.sendOTP = async (to, otp, name = "User") => {
  await transporter.sendMail({
    from: `"JD Infotech" <${process.env.MAIL_USER}>`,
    to,
    subject: "Your Login OTP",
    html: `
      <div style="font-family:Arial">
        <h2>Hello ${name},</h2>
        <h1>${otp}</h1>
        <p>OTP valid for 5 minutes</p>
      </div>
    `,
  });
};
