import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { applicationId, action, adminId } = await req.json();

    if (!applicationId || !action || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const application = await prisma.managerApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Create the actual manager user
      const user = await prisma.user.create({
        data: {
          name: application.name,
          email: application.email,
          password: application.password,
          role: 'MANAGER',
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: adminId,
        },
      });

      // Log the approval
      await prisma.activityLog.create({
        data: {
          userId: adminId,
          action: 'APPROVE_MANAGER',
          details: `Approved manager account: ${application.name} (${application.email})`,
        },
      });

      // Delete the application
      await prisma.managerApplication.delete({
        where: { id: applicationId },
      });

      return NextResponse.json({ 
        success: true, 
        message: `Manager account approved and created successfully` 
      });
    } else {
      // Reject the application
      await prisma.managerApplication.update({
        where: { id: applicationId },
        data: { status: 'REJECTED' },
      });

      // Log the rejection
      await prisma.activityLog.create({
        data: {
          userId: adminId,
          action: 'REJECT_MANAGER',
          details: `Rejected manager application: ${application.name} (${application.email})`,
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: `Manager application rejected` 
      });
    }

  } catch (error) {
    console.error('Manager approval error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
