import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Check if there's already a pending application
    const existingApplication = await prisma.managerApplication.findUnique({
      where: { email },
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'Application already submitted' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a pending application instead of a user
    await prisma.managerApplication.create({
      data: {
        name,
        email,
        password: hashedPassword,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Manager application submitted successfully. Waiting for admin approval.' 
    });

  } catch (error) {
    console.error('Manager registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
