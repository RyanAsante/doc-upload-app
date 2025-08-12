import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    const { deletedBy } = await req.json();
    
    console.log('🗑️ DELETE request for upload:', uploadId, 'by user:', deletedBy);
    
    // Get upload details before deletion for logging
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: { user: true },
    });
    
    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }
    
    // Get the user who is performing the deletion
    let performerUser = null;
    if (deletedBy) {
      performerUser = await prisma.user.findUnique({
        where: { id: deletedBy },
        select: { id: true, name: true, email: true, role: true }
      });
      console.log('👤 Performer user lookup:', performerUser);
    }
    
    // Delete the upload
    await prisma.upload.delete({
      where: { id: uploadId },
    });
    
    // Log the deletion activity with the correct user ID
    if (performerUser) {
      console.log('📝 Creating DELETE activity log for user:', performerUser.id, 'Role:', performerUser.role);
      try {
        const activityLog = await prisma.activityLog.create({
          data: {
            userId: performerUser.id, // Use the ID of who performed the deletion
            action: 'DELETE',
            details: `File "${upload.name}" deleted by ${performerUser.role.toLowerCase()} ${performerUser.name} (${performerUser.email}) for customer ${upload.user?.name || 'Unknown'} (${upload.user?.email || 'Unknown'})`,
          },
        });
        console.log('✅ DELETE activity log created:', activityLog);
      } catch (logError) {
        console.error('❌ Failed to create DELETE activity log:', logError);
      }
    } else {
      console.log('⚠️ No performer user found for DELETE action');
    }
    
    return NextResponse.json({ success: true, message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Error deleting upload:', error);
    return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    const { title, updatedBy } = await req.json();
    
    console.log('✏️ PATCH request for upload:', uploadId, 'by user:', updatedBy);
    
    // Get upload details before update for logging
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: { user: true },
    });
    
    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }
    
    // Update the upload title
    const updatedUpload = await prisma.upload.update({
      where: { id: uploadId },
      data: { title },
    });
    
    // Get the user who is performing the update
    let performerUser = null;
    if (updatedBy) {
      performerUser = await prisma.user.findUnique({
        where: { id: updatedBy },
        select: { id: true, name: true, email: true, role: true }
      });
      console.log('👤 Performer user lookup:', performerUser);
    }
    
    // Log the title update activity
    if (performerUser) {
      console.log('📝 Creating TITLE_UPDATE activity log for user:', performerUser.id, 'Role:', performerUser.role);
      try {
        const activityLog = await prisma.activityLog.create({
          data: {
            userId: performerUser.id, // Use the ID of who made the change
            action: 'TITLE_UPDATE',
            details: `File "${upload.name}" title updated by ${performerUser.role.toLowerCase()} ${performerUser.name} (${performerUser.email}) for customer ${upload.user?.name || 'Unknown'} (${upload.user?.email || 'Unknown'}) to "${title}"`,
          },
        });
        console.log('✅ TITLE_UPDATE activity log created:', activityLog);
      } catch (logError) {
        console.error('❌ Failed to create TITLE_UPDATE activity log:', logError);
      }
    } else {
      console.log('⚠️ No performer user found for TITLE_UPDATE action');
    }
    
    return NextResponse.json({ success: true, upload: updatedUpload });
  } catch (error) {
    console.error('Error updating upload:', error);
    return NextResponse.json({ error: 'Failed to update upload' }, { status: 500 });
  }
}
