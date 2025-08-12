import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { applicationId, action, adminId } = await req.json();

    console.log('Approval request:', { applicationId, action, adminId });

    if (!applicationId || !action || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find the application
    const application = await prisma.managerApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    console.log('Found application:', application);

    if (action === 'APPROVE') {
      try {
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

        console.log('Created manager user:', user);

        // Delete the application
        await prisma.managerApplication.delete({
          where: { id: applicationId },
        });

        console.log('Application deleted');

        return NextResponse.json({ 
          success: true, 
          message: `Manager account approved and created successfully` 
        });
      } catch (createError) {
        console.error('Error creating manager user:', createError);
        return NextResponse.json({ 
          error: `Failed to create manager user: ${createError instanceof Error ? createError.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    } else {
      // Reject the application
      try {
        await prisma.managerApplication.update({
          where: { id: applicationId },
          data: { status: 'REJECTED' },
        });

        console.log('Application rejected');

        return NextResponse.json({ 
          success: true, 
          message: `Manager application rejected` 
        });
      } catch (rejectError) {
        console.error('Error rejecting application:', rejectError);
        return NextResponse.json({ 
          error: `Failed to reject application: ${rejectError instanceof Error ? rejectError.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Manager approval error:', error);
    return NextResponse.json({ 
      error: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
