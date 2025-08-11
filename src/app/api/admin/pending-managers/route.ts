import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const pendingManagers = await prisma.user.findMany({
      where: {
        role: 'MANAGER',
        status: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ pendingManagers });
  } catch (error) {
    console.error('Error fetching pending managers:', error);
    return NextResponse.json({ error: 'Failed to fetch pending managers' }, { status: 500 });
  }
}
