import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Manager Upload API called');
    
    // Get the form data
    const formData = await req.formData();
    const file = formData.get('document') as File;
    const customerEmail = formData.get('customerEmail') as string;
    const managerEmail = formData.get('managerEmail') as string;

    if (!file) {
      console.log('❌ No file found in form data');
      return NextResponse.json({ message: 'Missing file' }, { status: 400 });
    }

    if (!customerEmail || !managerEmail) {
      console.log('❌ Missing customer or manager email');
      return NextResponse.json({ message: 'Missing customer or manager email' }, { status: 400 });
    }

    console.log('📦 Uploading file:', file.name, 'Size:', file.size);
    console.log('👤 Customer email:', customerEmail);
    console.log('👤 Manager email:', managerEmail);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileId = uuidv4();
    // Clean filename for Supabase storage (remove special characters and spaces)
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const newFileName = `${fileId}_${cleanFileName}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(newFileName, buffer, {
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
    }

    // Get a signed URL for private bucket access
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
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
    
    // Get the manager (who is doing the upload)
    const manager = await prisma.user.findUnique({
      where: { email: managerEmail },
    });
    
    console.log('🔍 Customer lookup result:', customer ? { id: customer.id, email: customer.email, role: customer.role } : 'Customer not found');
    console.log('🔍 Manager lookup result:', manager ? { id: manager.id, email: manager.email, role: manager.role } : 'Manager not found');
    
    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }
    
    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ message: 'Manager not found or unauthorized' }, { status: 403 });
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

    console.log('📁 Upload record created:', upload);

    // Log the upload activity for the manager
    try {
      const activityLog = await prisma.activityLog.create({
        data: {
          userId: manager.id, // Log activity for the manager
          action: 'UPLOAD',
          details: `Uploaded ${fileType.toLowerCase()} "${file.name}" for customer ${customer.name} (${customer.email})`,
        },
      });
      console.log('✅ Activity log created successfully:', activityLog);
    } catch (logError) {
      console.error('❌ Failed to create activity log:', logError);
    }

    console.log('✅ Manager upload successful:', newFileName);
    return NextResponse.json({ message: 'Upload success' }, { status: 200 });

  } catch (error) {
    console.error('❌ Manager upload error:', error);
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }
}
