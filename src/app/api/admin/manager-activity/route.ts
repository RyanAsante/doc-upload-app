import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Fetching manager activity...');
    
    // Get all activity logs from managers
    const managerActivityLogs = await prisma.activityLog.findMany({
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
      take: 100, // Limit to last 100 activities
    });

    console.log('📊 Found manager activity logs:', managerActivityLogs.length);
    console.log('📋 Sample log:', managerActivityLogs[0]);

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

    console.log('✅ Returning manager activity:', managerActivity.length, 'items');
    return NextResponse.json({ managerActivity });
  } catch (error) {
    console.error('❌ Error fetching manager activity:', error);
    return NextResponse.json({ error: 'Failed to fetch manager activity' }, { status: 500 });
  }
}
