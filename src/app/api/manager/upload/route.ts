import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Check if manager is authenticated
    const cookieStore = await cookies();
    const managerAuth = cookieStore.get('manager-auth');
    const managerEmail = cookieStore.get('manager-email');
    
    if (!managerAuth || managerAuth.value !== 'true') {
      return NextResponse.json({ message: 'Manager not authenticated' }, { status: 401 });
    }
    
    if (!managerEmail) {
      return NextResponse.json({ message: 'Manager email not found' }, { status: 401 });
    }
    
    // Get the form data
    const formData = await req.formData();
    const file = formData.get('document') as File;
    const customerEmail = formData.get('customerEmail') as string;

    if (!file) {
      return NextResponse.json({ message: 'Missing file' }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ message: 'Missing customer email' }, { status: 400 });
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

    // Get the customer (who the file is for)
    const customer = await prisma.user.findUnique({
      where: { email: customerEmail },
    });
    
    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }
    
    // Get the manager (who uploaded the file)
    const manager = await prisma.user.findUnique({
      where: { email: managerEmail.value },
    });

    if (!manager) {
      return NextResponse.json({ message: 'Manager not found' }, { status: 404 });
    }
    
    // Determine file type
    const fileType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    
    const upload = await prisma.upload.create({
      data: {
        name: file.name,
        imagePath: publicUrl,
        fileType: fileType,
        userId: customer.id, // File belongs to customer
      },
    });

    // Create a simple activity log entry
    try {
      await prisma.activityLog.create({
        data: {
          userId: manager.id, // Use manager ID
          action: 'UPLOAD',
          details: `File "${file.name}" uploaded by manager ${manager.name} (${manager.email}) for customer ${customer.name} (${customer.email})`,
        },
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }
    return NextResponse.json({ message: 'Upload success' }, { status: 200 });

  } catch (error) {
    console.error('❌ Manager upload error:', error);
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }
}
