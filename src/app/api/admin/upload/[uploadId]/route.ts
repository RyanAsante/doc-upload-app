import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    
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
    
    // Log the deletion activity
    if (upload.userId) {
      await prisma.activityLog.create({
        data: {
          userId: upload.userId,
          action: 'DELETE',
          details: `Deleted ${upload.fileType.toLowerCase()}: ${upload.name}`,
        },
      });
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
    const { title } = await req.json();
    
    // Update the upload title
    const updatedUpload = await prisma.upload.update({
      where: { id: uploadId },
      data: { title },
    });
    
    return NextResponse.json({ success: true, upload: updatedUpload });
  } catch (error) {
    console.error('Error updating upload:', error);
    return NextResponse.json({ error: 'Failed to update upload' }, { status: 500 });
  }
}
