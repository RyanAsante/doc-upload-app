import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASS;

    if (!adminPassword) {
      console.error('❌ Admin password not configured');
      return NextResponse.json({ error: 'Admin access not configured' }, { status: 500 });
    }

    if (password === adminPassword) {
      console.log('✅ Admin login successful');
      return NextResponse.json({ message: 'Admin login successful' }, { status: 200 });
    } else {
      console.log('❌ Invalid admin password attempt');
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

  } catch (error) {
    console.error('❌ Admin login error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
