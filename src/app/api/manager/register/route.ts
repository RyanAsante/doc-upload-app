import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sanitizeInput, isValidEmail, validatePasswordStrength, addSecurityHeaders } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

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

    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Check if there's already a pending application
    const existingApplication = await prisma.managerApplication.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'Application already submitted' }, { status: 400 });
    }

    // Hash password with higher salt rounds for better security
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a pending application instead of a user
    await prisma.managerApplication.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword,
        status: 'PENDING',
      },
    });

    const response = NextResponse.json({ 
      success: true, 
      message: 'Manager application submitted successfully. Waiting for admin approval.' 
    });

    // Add security headers
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Manager registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
