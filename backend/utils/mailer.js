const { Resend } = require("resend");

/**
 * INIT RESEND (SAFE)
 */
let resend;

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ RESEND_API_KEY missing — email disabled");
  resend = null;
} else {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("📧 Resend email service initialized");
}

/**
 * SEND OTP EMAIL
 */
exports.sendOTP = async (to, otp, name = "User") => {
  if (!resend) {
    throw new Error("Email service not configured");
  }

  if (!to || !otp) {
    throw new Error("Missing email or OTP");
  }

  try {
    await Promise.race([
      resend.emails.send({
        from: process.env.MAIL_FROM || "JD <onboarding@resend.dev>",
        to,
        subject: "Your Login OTP",
        html: `
          <div style="font-family:Arial,sans-serif">
            <h2>Hello ${name},</h2>
            <p>Your OTP is:</p>
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

    console.log("📧 OTP sent successfully:", to);
  } catch (err) {
    console.error("❌ OTP email failed:", err.message);
    throw err;
  }
};
