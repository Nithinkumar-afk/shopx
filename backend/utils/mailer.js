const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ RESEND_API_KEY missing (email disabled)");
}

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendOTP = async (to, otp, name = "User") => {
  if (!to || !otp) {
    throw new Error("Missing email or OTP");
  }

  await resend.emails.send({
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
  });

  console.log("📧 OTP sent via Resend");
};
