import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all uploads made by managers
    const managerUploads = await prisma.upload.findMany({
      where: {
        user: {
          role: 'MANAGER',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 uploads
    });

    // Transform the data to be more readable
    const managerActivity = managerUploads
      .filter(upload => upload.user !== null)
      .map(upload => ({
        id: upload.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        managerName: (upload.user as any).name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        managerEmail: (upload.user as any).email,
        fileName: upload.name,
        title: upload.title,
        fileType: upload.fileType,
        uploadedAt: upload.createdAt,
        action: 'UPLOAD',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: `${(upload.user as any).name} uploaded ${upload.fileType.toLowerCase()} "${upload.title || upload.name}" on ${upload.createdAt.toLocaleDateString()}`,
      }));

    return NextResponse.json({ managerActivity });
  } catch (error) {
    console.error('Error fetching manager activity:', error);
    return NextResponse.json({ error: 'Failed to fetch manager activity' }, { status: 500 });
  }
}
