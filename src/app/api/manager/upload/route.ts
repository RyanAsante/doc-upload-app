import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { SecureFileAccess } from '@/lib/secure-storage/file-access';
import { cookies } from 'next/headers';
import { sendFileUploadNotification } from '@/lib/email';

// Security constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export async function POST(req: NextRequest) {
  try {
    // Check if manager is authenticated
    const cookieStore = await cookies();
    const managerAuth = cookieStore.get('manager-auth');
    const managerEmail = cookieStore.get('manager-email');
    
    if (!managerAuth || managerAuth.value !== 'true') {
      return NextResponse.json({ error: 'Manager not authenticated' }, { status: 401 });
    }
    
    if (!managerEmail) {
      return NextResponse.json({ error: 'Manager email not found' }, { status: 401 });
    }

    // Verify manager exists and is approved
    const manager = await prisma.user.findUnique({
      where: { email: managerEmail.value },
      select: { id: true, status: true, role: true, name: true, email: true }
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager not found or invalid role' }, { status: 403 });
    }

    if (manager.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Manager account not approved' }, { status: 403 });
    }
    
    // Get the form data
    const formData = await req.formData();
    const file = formData.get('document') as File;
    const customerEmail = formData.get('customerEmail') as string;

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'Missing customer email' }, { status: 400 });
    }

    // Validate customer email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json({ error: 'Invalid customer email format' }, { status: 400 });
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
    
    // Store file securely (outside public folder)
    const secureFileName = await SecureFileAccess.storeFile({
      originalname: newFileName,
      buffer: buffer
    }, manager.id);
    
    // Create secure access URL (not public)
    const secureUrl = `/api/secure-file/${secureFileName}`;

    // Find or create customer user
    let customer = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!customer) {
      // Create customer user if they don't exist
      customer = await prisma.user.create({
        data: {
          name: customerEmail.split('@')[0], // Use email prefix as name
          email: customerEmail,
          password: '', // No password for manager-created accounts
          role: 'CUSTOMER',
          status: 'APPROVED', // Auto-approve customers created by managers
        },
      });
    }

    // Determine file type
    const fileType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    
    const upload = await prisma.upload.create({
      data: {
        name: file.name,
        imagePath: secureUrl,
        fileType: fileType,
        userId: customer.id,
      },
    });

    // Log the upload activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: manager.id,
          action: 'MANAGER_UPLOAD',
          details: `Manager uploaded ${fileType.toLowerCase()} for customer ${customerEmail}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        },
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    // Send email notification to customer
    try {
      await sendFileUploadNotification(
        customer.email,
        customer.name,
        file.name,
        fileType,
        manager.name || manager.email,
        'Manager'
      );
    } catch (emailError) {
      console.error('Failed to send file upload notification email:', emailError);
      // Don't fail the upload if email fails
    }

    return NextResponse.json({ 
      message: 'Upload success',
      uploadId: upload.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: fileType,
      customerEmail: customerEmail
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Manager upload error:', error);
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
