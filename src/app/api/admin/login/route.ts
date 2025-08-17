import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('Admin password not configured');
      return NextResponse.json({ error: 'Admin access not configured' }, { status: 500 });
    }

    if (password === adminPassword) {
      // Create a secure HTTP-only cookie
      const response = NextResponse.json({ message: 'Admin login successful' }, { status: 200 });
      response.cookies.set('admin-auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
      });
      
      return response;
    } else {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
