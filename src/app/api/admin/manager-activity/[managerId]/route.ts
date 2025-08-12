import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ managerId: string }> }
) {
  try {
    const { managerId } = await params;
    console.log('🔍 Fetching activity for manager:', managerId);
    
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

    console.log('📊 Found activity logs for manager:', managerActivityLogs.length);
    console.log('📋 Sample activity logs:', managerActivityLogs.slice(0, 3));

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

    console.log('✅ Returning manager activity:', managerActivity.length, 'items');
    return NextResponse.json({ managerActivity });
  } catch (error) {
    console.error('❌ Error fetching manager activity:', error);
    return NextResponse.json({ error: 'Failed to fetch manager activity' }, { status: 500 });
  }
}
