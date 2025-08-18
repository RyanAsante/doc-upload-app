import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email';
import { addSecurityHeaders } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        message: 'If an account with this email exists, a verification email has been sent.' 
      }, { status: 200 });
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json({ 
        message: 'This account is already verified. You can log in now.' 
      }, { status: 200 });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: tokenExpiry,
      },
    });

    // Send new verification email
    const emailSent = await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

    if (!emailSent) {
      return NextResponse.json({ 
        error: 'Failed to send verification email. Please try again later.' 
      }, { status: 500 });
    }

    // Log the resend activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'VERIFICATION_EMAIL_RESENT',
        details: 'User requested a new verification email',
      },
    });

    const response = NextResponse.json({ 
      message: 'Verification email sent successfully. Please check your inbox.' 
    }, { status: 200 });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
