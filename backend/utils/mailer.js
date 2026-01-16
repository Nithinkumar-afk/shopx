const { Resend } = require("resend");

/**
 * INIT RESEND SAFELY
 */
let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("📧 Resend email service initialized");
} else {
  console.warn("⚠️ RESEND_API_KEY missing — email disabled");
}

/**
 * SEND OTP EMAIL
 * ✔ NEVER crashes backend
 * ✔ OTP still valid if email fails
 */
exports.sendOTP = async (to, otp, name = "User") => {
  // ❌ Email disabled
  if (!resend) {
    console.warn("⚠️ Email skipped (Resend not configured)");
    return false;
  }

  // ❌ Invalid input
  if (!to || !otp) {
    console.warn("⚠️ Email skipped (missing email or OTP)");
    return false;
  }

  try {
    // ⏱️ HARD TIMEOUT (5 seconds max)
    await Promise.race([
      resend.emails.send({
        from: process.env.MAIL_FROM || "JD <onboarding@resend.dev>",
        to,
        subject: "Your Login OTP",
        html: `
          <div style="font-family: Arial, sans-serif">
            <h2>Hello ${name},</h2>
            <p>Your OTP:</p>
            <h1 style="letter-spacing:4px">${otp}</h1>
            <p><b>Valid for 5 minutes</b></p>
            <hr/>
            <small>JD Infotech Security</small>
          </div>
        `,
      }),

      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email timeout")), 5000)
      ),
    ]);

    console.log("📧 OTP sent successfully to:", to);
    return true;
  } catch (err) {
    // ❗ DO NOT THROW (IMPORTANT)
    console.error("❌ OTP MAIL FAILED:", err.message);
    console.warn("⚠️ OTP email failed, OTP still valid");
    return false;
  }
};
