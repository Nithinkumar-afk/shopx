const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendOTP = async (to, otp, name = "User") => {
  try {
    const { error } = await resend.emails.send({
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

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Mailer crash:", err);
    return false;
  }
};
