import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Resend (only if API key is available)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Generate verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Send verification email
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  try {
    if (!resend) {
      console.error('Resend not configured. Please set RESEND_API_KEY in your environment variables.');
      return false;
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    
    // Use the correct Resend API method
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@resend.dev',
      to: [email],
      subject: 'Verify Your Email - Doc Upload App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Welcome to Doc Upload App!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <br>
          <p>Best regards,<br>The Doc Upload App Team</p>
        </div>
      `,
    });

    // Check if email was sent successfully
    if (result && result.data && !result.error) {
      console.log('Verification email sent successfully:', result.data.id);
      return true;
    } else {
      console.error('Failed to send verification email:', result?.error);
      return false;
    }
    
  } catch (error) {
    console.error('Error sending verification email:', error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

// Send password reset email (bonus feature)
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  try {
    if (!resend) {
      console.error('Resend not configured. Please set RESEND_API_KEY in your environment variables.');
      return false;
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    // Use the correct Resend API method
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@resend.dev',
      to: [email],
      subject: 'Reset Your Password - Doc Upload App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <br>
          <p>Best regards,<br>The Doc Upload App Team</p>
        </div>
      `,
    });

    // Check if email was sent successfully
    if (result && result.data && !result.error) {
      console.log('Password reset email sent successfully:', result.data.id);
      return true;
    } else {
      console.error('Failed to send password reset email:', result?.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}
