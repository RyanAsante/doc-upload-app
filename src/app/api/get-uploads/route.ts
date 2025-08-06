import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const uploads = await prisma.upload.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(uploads); // ✅ Returns valid JSON
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
  }
}