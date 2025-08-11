import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, action, adminId } = await req.json();

    if (!userId || !action || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'User is not a manager' }, { status: 400 });
    }

    // Update user status
    const updateData: {
      status: 'APPROVED' | 'REJECTED';
      approvedAt?: Date;
      approvedBy?: string;
    } = {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
    };

    if (action === 'APPROVE') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = adminId;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: action === 'APPROVE' ? 'APPROVE_MANAGER' : 'REJECT_MANAGER',
        details: `${action === 'APPROVE' ? 'Approved' : 'Rejected'} manager account: ${user.name} (${user.email})`,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Manager account ${action.toLowerCase()}d successfully` 
    });

  } catch (error) {
    console.error('Manager approval error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
