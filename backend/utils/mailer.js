const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  throw new Error("❌ RESEND_API_KEY missing");
}

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendOTP = async (to, otp, name = "User") => {
  try {
    await resend.emails.send({
      // ✅ SAFE DEFAULT (works for any email during launch)
      from: "ShopX <no-reply@resend.dev>",
      to,
      subject: "Your ShopX Login OTP",
      html: `
        <div style="font-family:Arial, sans-serif; max-width:500px">
          <h2>Hello ${name},</h2>
          <p>Your one-time password (OTP) is:</p>
          <div style="font-size:32px; font-weight:bold; margin:16px 0">
            ${otp}
          </div>
          <p>This OTP is valid for <strong>5 minutes</strong>.</p>
          <p style="color:#888; font-size:12px">
            If you didn’t request this, you can ignore this email.
          </p>
        </div>
      `,
    });

    // ✅ SUCCESS → just return
    return;

  } catch (err) {
    console.error("🔥 RESEND MAIL ERROR:", err);
    throw new Error("OTP_EMAIL_FAILED");
  }
};
