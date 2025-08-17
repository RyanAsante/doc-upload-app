import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ managerId: string }> }
) {
  try {
    const { managerId } = await params;
    
    // First, let's check what user this managerId corresponds to
    const managerUser = await prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, name: true, email: true, role: true }
    });
    
    // Get all activity logs for this specific manager
    const managerActivityLogs = await prisma.activityLog.findMany({
      where: {
        userId: managerId,
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
      take: 100, // Limit to last 100 activities
    });

    // Let's also check if there are ANY activity logs with this userId
    const totalLogsForUser = await prisma.activityLog.count({
      where: { userId: managerId }
    });

    // Transform the data to be more readable
    const managerActivity = managerActivityLogs.map((log) => ({
      id: log.id,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt,
      managerName: log.user.name,
      managerEmail: log.user.email,
      managerRole: log.user.role,
    }));

    return NextResponse.json({ managerActivity });
  } catch (error) {
    console.error('❌ Error fetching manager activity:', error);
    return NextResponse.json({ error: 'Failed to fetch manager activity' }, { status: 500 });
  }
}
