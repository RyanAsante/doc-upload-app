import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { isValidEmail } from '@/lib/security';
import { addSecurityHeaders } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const { email, userType } = await req.json();

    // Validate input
    if (!email || !userType) {
      return NextResponse.json({ error: 'Email and user type are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!['CUSTOMER', 'MANAGER'].includes(userType)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    // Find user by email and user type
    const user = await prisma.user.findUnique({
      where: { 
        email: email,
        role: userType === 'CUSTOMER' ? 'CUSTOMER' : 'MANAGER'
      },
      select: { id: true, name: true, email: true, role: true, status: true }
    });

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return NextResponse.json({ 
        message: 'If an account with this email exists, a password reset link has been sent.' 
      }, { status: 200 });
    }

    // Check if user is approved
    if (user.status !== 'APPROVED') {
      return NextResponse.json({ 
        message: 'If an account with this email exists, a password reset link has been sent.' 
      }, { status: 200 });
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: resetToken,
        emailVerificationExpires: tokenExpiry,
      },
    });

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken
    );

    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email);
      return NextResponse.json({ 
        message: 'If an account with this email exists, a password reset link has been sent.' 
      }, { status: 200 });
    }

    const response = NextResponse.json({ 
      message: 'If an account with this email exists, a password reset link has been sent.' 
    }, { status: 200 });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ 
      message: 'If an account with this email exists, a password reset link has been sent.' 
    }, { status: 200 });
  }
}
