import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { validatePasswordStrength } from '@/lib/security';
import { addSecurityHeaders } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors 
      }, { status: 400 });
    }

    // Find user by reset token
    const user = await prisma.user.findUnique({
      where: { 
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() } // Token not expired
      },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Log the password reset activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET',
          details: `Password reset completed successfully for ${user.email}`,
        },
      });
    } catch (logError) {
      console.error('Failed to create password reset activity log:', logError);
    }

    const response = NextResponse.json({ 
      message: 'Password reset successfully. You can now log in with your new password.' 
    }, { status: 200 });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Password reset failed' }, { status: 500 });
  }
}
