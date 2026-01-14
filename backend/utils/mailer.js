const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY missing");
}

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendOTP = async (to, otp, name = "User") => {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
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
      `,
    });

    console.log("✅ OTP email sent to", to);
  } catch (err) {
    console.error("❌ SEND OTP EMAIL ERROR:", err);
    throw new Error("Email delivery failed");
  }
};
