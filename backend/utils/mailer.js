const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY missing");
}

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendOTP = async (to, otp, name = "User") => {
  try {
    const result = await resend.emails.send({
      from: process.env.MAIL_FROM || "ShopX <onboarding@resend.dev>",
      to,
      subject: "Your ShopX Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Hello ${name},</h2>
          <p>Your login OTP is:</p>
          <h1 style="letter-spacing:4px">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          <p>If you didn’t request this, ignore this email.</p>
        </div>
      `
    });

    console.log("📨 OTP email delivered:", result.id);
    return true;

  } catch (err) {
    console.error("❌ RESEND MAIL ERROR:", err.message);
    throw err; // 🚨 IMPORTANT: FAIL LOUD
  }
};
