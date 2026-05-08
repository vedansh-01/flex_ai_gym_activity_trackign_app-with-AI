const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOTP = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"FlexAI 💪" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your FlexAI Verification Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: #0C0C0C; padding: 40px; border-radius: 16px;
                    max-width: 480px; margin: auto;">
          <h1 style="color: #FF5722; font-size: 28px; margin-bottom: 2px; font-weight: 900;">FlexAI</h1>
          <p style="color: #71717A; font-size: 12px; margin-top: 0;">AI-powered gym & nutrition tracking</p>
          <hr style="border: none; border-top: 1px solid #27272A; margin: 24px 0;" />

          <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-bottom: 8px;">
            Verify your email ✉️
          </h2>
          <p style="color: #A1A1AA; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Use the code below to complete your sign-up. It expires in
            <strong style="color: #fff;">10 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="background: #1A1A1A; border: 2px solid #FF5722; border-radius: 16px;
                      text-align: center; padding: 32px 0; margin-bottom: 24px;">
            <span style="color: #FF5722; font-size: 52px; font-weight: 900;
                         letter-spacing: 14px; font-variant-numeric: tabular-nums;">
              ${otp}
            </span>
          </div>

          <p style="color: #52525B; font-size: 12px; line-height: 1.6;">
            If you didn't request this, you can safely ignore this email.
            Your account won't be created until you verify.
          </p>

          <hr style="border: none; border-top: 1px solid #27272A; margin: 24px 0;" />
          <p style="color: #3F3F46; font-size: 11px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} FlexAI · All rights reserved
          </p>
        </div>
      `,
    });
    console.log(`✅ OTP email sent to ${email} (messageId: ${info.messageId})`);
  } catch (err) {
    console.error(`❌ Failed to send OTP to ${email}:`, err.message);
  }
};

module.exports = { sendOTP };
