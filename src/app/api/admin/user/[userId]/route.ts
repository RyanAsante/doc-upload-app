import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await context.params;
  const userId = resolvedParams.userId;

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const uploads = await prisma.upload.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      name: true,
      imagePath: true,
      fileType: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ user, uploads });
}