import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Fetching manager activity...');
    
    // Let's check if we can even access the database
    try {
      const userCount = await prisma.user.count();
      console.log('👥 Total users in database:', userCount);
      
      const uploadCount = await prisma.upload.count();
      console.log('📁 Total uploads in database:', uploadCount);
      
      // Check if ActivityLog table exists by trying to count
      const activityLogCount = await prisma.activityLog.count();
      console.log('📝 Total activity logs in database:', activityLogCount);
    } catch (dbError) {
      console.error('❌ Database access error:', dbError);
      return NextResponse.json({ error: 'Database access failed' }, { status: 500 });
    }
    
    // First, let's check if there are ANY activity logs at all
    const allActivityLogs = await prisma.activityLog.findMany({
      take: 5,
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
    });
    
    console.log('📊 Total activity logs found (first 5):', allActivityLogs.length);
    console.log('📋 Sample activity logs:', allActivityLogs);
    
    // Now let's check specifically for manager activity logs
    // First get all users with MANAGER role
    const managerUsers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: { id: true }
    });
    
    const managerIds = managerUsers.map((user: { id: string }) => user.id);
    console.log('👥 Manager IDs found:', managerIds);
    
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

    console.log('📊 Found manager activity logs:', managerActivityLogs.length);
    console.log('📋 Sample manager log:', managerActivityLogs[0]);

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
