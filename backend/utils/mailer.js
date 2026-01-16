const { Resend } = require("resend");

/**
 * Initialize Resend
 */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send OTP Email
 */
exports.sendOTP = async (to, otp, name = "User") => {
  try {
    console.log("📨 Sending OTP to:", to);

    const response = await resend.emails.send({
      from: "JD <onboarding@resend.dev>", // ✅ REQUIRED
      to: to,
      subject: "Your JD Login OTP",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Hello ${name},</h2>
          <p>Your login OTP is:</p>
          <h1 style="letter-spacing:4px">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          <br/>
          <p>If you didn’t request this, please ignore.</p>
          <hr/>
          <small>JD Security System</small>
        </div>
      `,
    });

    console.log("✅ OTP email sent:", response.id);
    return true;

  } catch (error) {
    console.error("❌ Resend email failed:", error);
    throw new Error("Failed to send OTP email");
  }
};
