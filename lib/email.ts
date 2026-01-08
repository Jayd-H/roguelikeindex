import nodemailer from "nodemailer";

const port = parseInt(process.env.SMTP_PORT || '465');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      // ⚠️ UPDATED: Uses your actual domain so emails don't bounce/get flagged
      from: '"RoguelikeIndex" <noreply@jaydchw.com>',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>You requested a password reset for your RoguelikeIndex account.</p>
          <p>Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Reset Password</a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('--- DEV MODE: Password Reset Link ---');
      console.log(resetLink);
      console.log('-------------------------------------');
    }
  }
}