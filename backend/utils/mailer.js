const { Resend } = require("resend");

/**
 * Safe mailer initialization
 * Never crashes app if API key is missing
 */
let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("📧 Resend mailer initialized");
} else {
  console.warn("⚠️ RESEND_API_KEY missing – Email disabled");
}

/**
 * Send OTP Email
 * @param {string} to
 * @param {string} otp
 * @param {string} name
 * @returns {boolean}
 */
exports.sendOTP = async (to, otp, name = "User") => {
  // Mailer disabled (local/dev)
  if (!resend) {
    console.warn(`📭 OTP skipped (mailer disabled) → ${to}, OTP: ${otp}`);
    return true; // IMPORTANT: return true so login still works
  }

  try {
    const result = await resend.emails.send({
      from: "JD Infotech <noreply@resend.dev>",
      to,
      subject: "Your Login OTP",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Hello ${name},</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:2px">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          <br/>
          <p>— JD Infotech</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("❌ Resend API error:", result.error);
      return false;
    }

    console.log("✅ OTP email sent to", to);
    return true;

  } catch (err) {
    console.error("❌ OTP mail failed:", err.message);
    return false;
  }
};

