import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    // Check if token has expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 });
    }

    // Update user to verified status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        status: 'APPROVED', // Now approve the user
      },
    });

    // Log the verification activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        details: 'User verified their email address',
      },
    });

    const response = NextResponse.json({ 
      message: 'Email verified successfully! You can now log in to your account.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: true,
        status: 'APPROVED'
      }
    }, { status: 200 });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Something went wrong during verification' }, { status: 500 });
  }
}
