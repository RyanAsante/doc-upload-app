import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Get the form data
    const formData = await req.formData();
    const file = formData.get('document') as File;

    if (!file) {
      return NextResponse.json({ message: 'Missing file' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileId = uuidv4();
    // Clean filename for Supabase storage (remove special characters and spaces)
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const newFileName = `${fileId}_${cleanFileName}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase().storage
      .from('uploads')
      .upload(newFileName, buffer, {
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
    }

    // Get a signed URL for private bucket access
    const { data: signedUrlData, error: signedUrlError } = await supabase().storage
      .from('uploads')
      .createSignedUrl(newFileName, 60 * 60 * 24 * 365); // 1 year expiry
    
    if (signedUrlError) {
      console.error('❌ Signed URL error:', signedUrlError);
      return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
    }
    
    const publicUrl = signedUrlData.signedUrl;

    const userEmail = req.headers.get('x-user-email') || 'unknown@example.com';

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    
    // Determine file type
    const fileType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    
    const upload = await prisma.upload.create({
      data: {
        name: file.name,
        imagePath: publicUrl,
        fileType: fileType,
        userId: user?.id || null,
      },
    });

    // Log the upload activity
    if (user?.id) {
      try {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'UPLOAD',
            details: `Uploaded ${fileType.toLowerCase()}: ${file.name}`,
          },
        });
      } catch (logError) {
        console.error('Failed to create activity log:', logError);
      }
    }
    return NextResponse.json({ message: 'Upload success' }, { status: 200 });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }
}
