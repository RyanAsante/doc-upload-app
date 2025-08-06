import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    console.log("📥 Signup attempt:", { name, email });

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.warn("⚠️ User already exists:", email);
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

    console.log("✅ User created:", user.id);

    return NextResponse.json({ message: 'User created', user }, { status: 201 });

  } catch (error) {
    console.error("❌ Signup error:", error);
    return NextResponse.json({ message: 'Something went wrong during signup' }, { status: 500 });
  }
}