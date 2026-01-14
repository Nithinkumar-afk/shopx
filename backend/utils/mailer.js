const nodemailer = require("nodemailer");

if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.error("❌ MAIL_USER or MAIL_PASS missing in environment variables");
}

const transporter = nodemailer.createTransport({
  service: "gmail", // ✅ safest for Railway
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// ✅ Verify transporter ONCE at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailer verification failed:", error);
  } else {
    console.log("✅ Mailer ready to send emails");
  }
});

exports.sendOTP = async (to, otp, name = "User") => {
  try {
    await transporter.sendMail({
      from: `"JD Infotech" <${process.env.MAIL_USER}>`,
      to,
      subject: "Your JD Infotech Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Hello ${name},</h2>
          <p>Your login OTP is:</p>
          <h1 style="letter-spacing: 3px">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          <br/>
          <p style="color: gray; font-size: 12px">
            If you didn’t request this, you can safely ignore this email.
          </p>
        </div>
      `
    });
  } catch (err) {
    console.error("❌ SEND OTP EMAIL ERROR:", err);
    throw new Error("Email delivery failed");
  }
};
