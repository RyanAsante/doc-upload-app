import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    const { deletedBy } = await req.json();
    
    // Get upload details before deletion for logging
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: { user: true },
    });
    
    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }
    
    // Delete the upload
    await prisma.upload.delete({
      where: { id: uploadId },
    });
    
    // Log the deletion activity with the correct user ID
    if (deletedBy) {
      console.log('📝 Creating DELETE activity log for user:', deletedBy);
      try {
        const activityLog = await prisma.activityLog.create({
          data: {
            userId: deletedBy, // Use the ID of who performed the deletion
            action: 'DELETE',
            details: `Deleted ${upload.fileType.toLowerCase()}: ${upload.name}`,
          },
        });
        console.log('✅ DELETE activity log created:', activityLog);
      } catch (logError) {
        console.error('❌ Failed to create DELETE activity log:', logError);
      }
    } else {
      console.log('⚠️ No deletedBy provided for DELETE action');
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
    
    // Log the title update activity
    if (updatedBy) {
      console.log('📝 Creating TITLE_UPDATE activity log for user:', updatedBy);
      try {
        const activityLog = await prisma.activityLog.create({
          data: {
            userId: updatedBy, // Use the ID of who made the change
            action: 'TITLE_UPDATE',
            details: `Updated title of ${upload.fileType.toLowerCase()} "${upload.name}" to "${title}"`,
          },
        });
        console.log('✅ TITLE_UPDATE activity log created:', activityLog);
      } catch (logError) {
        console.error('❌ Failed to create TITLE_UPDATE activity log:', logError);
      }
    } else {
      console.log('⚠️ No updatedBy provided for TITLE_UPDATE action');
    }
    
    return NextResponse.json({ success: true, upload: updatedUpload });
  } catch (error) {
    console.error('Error updating upload:', error);
    return NextResponse.json({ error: 'Failed to update upload' }, { status: 500 });
  }
}
