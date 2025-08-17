import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all users with MANAGER role
    const managerUsers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: { id: true }
    });
    
    const managerIds = managerUsers.map((user: { id: string }) => user.id);
    
    // Get activity logs where userId is in the list of manager IDs
    const managerActivityLogs = await prisma.activityLog.findMany({
      where: {
        userId: {
          in: managerIds
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
      take: 100, // Limit to last 100 activities
    });

    // Transform the data to be more readable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const managerActivity = managerActivityLogs.map((log: any) => ({
      id: log.id,
      managerName: log.user.name,
      managerEmail: log.user.email,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt,
      activityType: 'LOG',
    }));

    return NextResponse.json({ managerActivity });
  } catch (error) {
    console.error('Error fetching manager activity:', error);
    return NextResponse.json({ error: 'Failed to fetch manager activity' }, { status: 500 });
  }
}
