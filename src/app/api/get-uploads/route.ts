import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const userEmail = req.headers.get('x-user-email');
  
  if (!userEmail) {
    return NextResponse.json({ error: 'User email required' }, { status: 400 });
  }

  try {
    // Get current user's uploads
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        uploads: {
          select: {
            id: true,
            title: true,
            name: true,
            imagePath: true,
            fileType: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        uploadCount: user.uploads.length,
      },
      uploads: user.uploads 
    });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
  }
}