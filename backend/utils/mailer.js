const { Resend } = require("resend");

/**
 * INIT RESEND SAFELY
 * Do NOT create client if key missing
 */
let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("📧 Resend email service initialized");
} else {
  console.warn("⚠️ RESEND_API_KEY missing — email disabled");
}

/**
 * SEND OTP (FAIL-FAST, NON-BLOCKING SAFE)
 */
exports.sendOTP = async (to, otp, name = "User") => {
  // 🚫 Email disabled
  if (!resend) {
    throw new Error("Email service not configured");
  }

  if (!to || !otp) {
    throw new Error("Missing email or OTP");
  }

  try {
    // ⏱️ HARD TIMEOUT PROTECTION (5s)
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

    console.log("📧 OTP sent via Resend:", to);
  } catch (err) {
    // ❗ NEVER crash backend
    console.error("❌ Resend email failed:", err.message);
    throw err;
  }
};
