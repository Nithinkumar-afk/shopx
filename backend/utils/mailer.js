const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendOTP = async (to, otp, name = "User") => {
  try {
    const result = await resend.emails.send({
      from: "JD Infotech <noreply@resend.dev>",
      to,
      subject: "Your Login OTP",
      html: `
        <div style="font-family:Arial">
          <h2>Hello ${name},</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>Valid for 5 minutes</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("❌ Resend error:", result.error);
      return false;
    }

    console.log("✅ OTP email sent to", to);
    return true;

  } catch (err) {
    console.error("❌ OTP mail failed:", err.message);
    return false;
  }
};
