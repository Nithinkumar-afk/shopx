const { Resend } = require("resend");

/* ===============================
   ENV CHECK
================================ */
if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY missing — emails will NOT be sent");
}

/* ===============================
   RESEND INIT
================================ */
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/* ===============================
   SEND MAGIC LINK EMAIL
================================ */
exports.sendMagicLink = async (email, link, name = "User") => {
  if (!resend) {
    throw new Error("Email service not configured");
  }

  try {
    console.log("📨 Sending magic link to:", email);

    const response = await resend.emails.send({
      // ✅ VERIFIED SENDER (WORKS 100%)
      from: "JD Security <onboarding@resend.dev>",
      to: email,
      subject: "Login to JD – Secure Magic Link",

      // TEXT FALLBACK
      text: `Hello ${name},

Use the link below to securely log in:

${link}

This link is valid for 10 minutes.
If you did not request this login, ignore this email.

— JD Security Team`,

      // HTML EMAIL
      html: `
<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
  <h2>Hello ${name},</h2>

  <p>Click the button below to securely log in to <b>JD</b>:</p>

  <a href="${link}"
     style="
       display:inline-block;
       padding:12px 22px;
       background:#111;
       color:#fff;
       text-decoration:none;
       border-radius:6px;
       margin:14px 0;
       font-weight:bold;
     ">
    Login Securely
  </a>

  <p>This link is valid for <b>10 minutes</b>.</p>

  <p style="color:#555;font-size:14px">
    If you did not request this login, you can safely ignore this email.
  </p>

  <hr />
  <small>JD Security System</small>
</div>
      `,
    });

    console.log("✅ Magic link email sent:", response.id);
    return true;

  } catch (error) {
    console.error("❌ Magic link email failed:", error);
    throw error;
  }
};
