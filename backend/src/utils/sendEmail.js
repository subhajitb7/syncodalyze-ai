import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"AICodeReview Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    // Don't crash the server if email fails — log OTP to console as fallback
    return false;
  }
};

export const sendOtpEmail = async (email, otp) => {
  const subject = 'Your AICodeReview Verification Code';
  const html = `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">AICodeReview Verification</h2>
      <p>Your verification code is:</p>
      <div style="background: #f0f4ff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">${otp}</span>
      </div>
      <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
    </div>
  `;

  const sent = await sendEmail(email, subject, html);
  if (!sent) {
    console.log(`[OTP FALLBACK] OTP for ${email}: ${otp}`);
  }
  return sent;
};

export default sendEmail;
