import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeInput, isValidEmail, validatePasswordStrength, addSecurityHeaders } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // Input validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors 
      }, { status: 400 });
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password with higher salt rounds for better security
    const hashed = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashed,
        status: 'APPROVED', // Auto-approve regular users
      },
    });

    // Remove password from response
    const { password: userPassword, ...userWithoutPassword } = user;

    const response = NextResponse.json({ 
      message: 'User created successfully', 
      user: userWithoutPassword 
    }, { status: 201 });

    // Add security headers
    return addSecurityHeaders(response);

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: 'Something went wrong during signup' }, { status: 500 });
  }
}