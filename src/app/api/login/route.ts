import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email: string = body.email
    const password: string = body.password

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
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