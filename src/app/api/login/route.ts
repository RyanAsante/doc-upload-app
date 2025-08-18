import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { railwayPrisma } from '@/lib/prisma-railway'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email: string = body.email
    const password: string = body.password

    const user = await railwayPrisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check if user has verified their email
    if (!user.emailVerified) {
      return NextResponse.json({ 
        error: 'Please verify your email address before logging in. Check your inbox for a verification link.' 
      }, { status: 401 })
    }

    // Check if user is approved
    if (user.status !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Your account is pending approval. Please contact an administrator.' 
      }, { status: 401 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return NextResponse.json({ message: 'Login successful' }, { status: 200 })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}