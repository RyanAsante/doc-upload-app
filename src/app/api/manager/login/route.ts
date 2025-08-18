import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied: Not a manager' }, { status: 403 });
    }

    if (user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Account not approved yet. Please wait for admin approval.' }, { status: 403 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('manager-auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    // Also store the manager's email for identification
    cookieStore.set('manager-email', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Manager login successful',
      email: user.email // Return manager email for localStorage
    });
  } catch (error) {
    console.error('Manager login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
