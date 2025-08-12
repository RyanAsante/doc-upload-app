import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get the manager's email from the request headers or cookies
    // For now, we'll filter out all MANAGER role users
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: 'MANAGER' // Exclude all managers
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        uploads: {
          select: {
            id: true,
            title: true,
            name: true,
            imagePath: true,
            fileType: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
