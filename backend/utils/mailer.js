const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendOTP = async (to, otp, name = "User") => {
  console.log("🟢 sendOTP called:", to, otp);

  await resend.emails.send({
    from: "JD <nithinkumar9489@gmail.com>",
    to,
    subject: "Your JD Login OTP",
    html: `
      <h2>Hello ${name}</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>Valid for 5 minutes</p>
    `,
  });

  console.log("📧 OTP email SENT via Resend");
};
