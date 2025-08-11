import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create pending manager account
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'MANAGER',
        status: 'PENDING',
      },
    });

    // Log the registration
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        details: `Manager registration: ${name} (${email})`,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Manager account created successfully. Waiting for admin approval.' 
    });

  } catch (error) {
    console.error('Manager registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
