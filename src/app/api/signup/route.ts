import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashed = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
      },
    });

    return NextResponse.json({ message: 'User created', user }, { status: 201 });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: 'Something went wrong during signup' }, { status: 500 });
  }
}