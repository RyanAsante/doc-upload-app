import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email: string = body.email
    const password: string = body.password

    console.log('Login attempt:', email, password)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    console.log('✅ User found:', user)

    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('Password match:', isPasswordValid)

    if (!isPasswordValid) {
      console.log('❌ Invalid password')
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    console.log('✅ Login successful')
    return NextResponse.json({ message: 'Login successful' }, { status: 200 })

  } catch (error) {
    console.error('🔥 Login error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}