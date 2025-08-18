import { NextRequest, NextResponse } from 'next/server';
import { SecureFileAccess } from '@/lib/secure-storage/file-access';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;
    
    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    // Serve the file with access control
    return await SecureFileAccess.serveFile(fileName, req);
  } catch (error) {
    console.error('Secure file serve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
