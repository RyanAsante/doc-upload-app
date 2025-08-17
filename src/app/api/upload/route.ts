import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

// Security constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export async function POST(req: NextRequest) {
  try {
    // Authentication check (handled by middleware, but double-check)
    const userEmail = req.headers.get('x-user-email');
    if (!userEmail || userEmail === 'unknown@example.com') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user exists and is approved
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, status: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Account not approved' }, { status: 403 });
    }

    // Get the form data
    const formData = await req.formData();
    const file = formData.get('document') as File;

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // File type validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only images and videos are allowed.' 
      }, { status: 400 });
    }

    // Additional file type validation by checking file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_TYPES.some(type => {
      const extension = type.split('/')[1];
      return fileName.endsWith(`.${extension}`) || fileName.endsWith(`.${extension.split('+')[0]}`);
    });

    if (!hasValidExtension) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Additional security: Check file header magic bytes for common file types
    const isValidFile = validateFileHeader(buffer, file.type);
    if (!isValidFile) {
      return NextResponse.json({ error: 'Invalid file content' }, { status: 400 });
    }

    const fileId = uuidv4();
    // Clean filename for Supabase storage (remove special characters and spaces)
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const newFileName = `${fileId}_${cleanFileName}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase().storage
      .from('uploads')
      .upload(newFileName, buffer, {
        contentType: file.type,
        upsert: false, // Prevent overwriting existing files
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get a signed URL for private bucket access (shorter expiry for security)
    const { data: signedUrlData, error: signedUrlError } = await supabase().storage
      .from('uploads')
      .createSignedUrl(newFileName, 60 * 60 * 24 * 7); // 7 days expiry (more secure)
    
    if (signedUrlError) {
      console.error('❌ Signed URL error:', signedUrlError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
    
    const publicUrl = signedUrlData.signedUrl;

    // Determine file type
    const fileType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    
    const upload = await prisma.upload.create({
      data: {
        name: file.name,
        imagePath: publicUrl,
        fileType: fileType,
        userId: user.id,
      },
    });

    // Log the upload activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'UPLOAD',
          details: `Uploaded ${fileType.toLowerCase()}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        },
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    return NextResponse.json({ 
      message: 'Upload success',
      uploadId: upload.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: fileType
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// Helper function to validate file headers
function validateFileHeader(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 8) return false;

  const header = buffer.subarray(0, 8);
  
  // JPEG
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return header[0] === 0xFF && header[1] === 0xD8;
  }
  
  // PNG
  if (mimeType === 'image/png') {
    return header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
  }
  
  // GIF
  if (mimeType === 'image/gif') {
    return (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) ||
           (header[3] === 0x47 && header[4] === 0x49 && header[5] === 0x46);
  }
  
  // WebP
  if (mimeType === 'image/webp') {
    return header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[8] === 0x57;
  }
  
  // MP4
  if (mimeType === 'video/mp4') {
    return header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70;
  }
  
  // WebM
  if (mimeType === 'video/webm') {
    return header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3;
  }
  
  // For other types, accept them (could add more validation)
  return true;
}
