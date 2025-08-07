import { NextRequest, NextResponse } from 'next/server';
import formidable, { IncomingForm } from 'formidable';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { IncomingMessage } from 'http';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  const contentLength = req.headers.get('content-length') || '0';

  const body = await req.arrayBuffer();
  const stream = Readable.from(Buffer.from(body));

  const mockReq = Object.assign(stream, {
    headers: {
      'content-type': contentType,
      'content-length': contentLength,
    },
    method: 'POST',
    url: '',
  }) as IncomingMessage;

  const form = new IncomingForm({ uploadDir, keepExtensions: true });

  return new Promise<Response>((resolve) => {
    form.parse(mockReq, async (err, fields, files) => {
      if (err) {
        console.error('❌ Upload error:', err);
        return resolve(
          NextResponse.json({ message: 'Upload failed' }, { status: 500 })
        );
      }

      console.log('📦 Parsed files:', files);
      const file = files?.document?.[0];

      if (!file) {
        return resolve(NextResponse.json({ message: 'Missing file' }, { status: 400 }));
      }

      const fileId = uuidv4();
      const newFileName = `${fileId}_${file.originalFilename}`;
      
      // Read the file buffer
      const fileBuffer = fs.readFileSync(file.filepath);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(newFileName, fileBuffer, {
          contentType: file.mimetype || 'image/jpeg',
        });

      if (uploadError) {
        console.error('❌ Supabase upload error:', uploadError);
        return resolve(
          NextResponse.json({ message: 'Upload failed' }, { status: 500 })
        );
      }

      // Get a signed URL for private bucket access
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('uploads')
        .createSignedUrl(newFileName, 60 * 60 * 24 * 365); // 1 year expiry
      
      if (signedUrlError) {
        console.error('❌ Signed URL error:', signedUrlError);
        return resolve(
          NextResponse.json({ message: 'Upload failed' }, { status: 500 })
        );
      }
      
      const publicUrl = signedUrlData.signedUrl;

      const userEmail = req.headers.get('x-user-email') || 'unknown@example.com';

      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });
      
      await prisma.upload.create({
        data: {
          name: user?.name || userEmail, // optional: save their actual name
          imagePath: publicUrl,
          userId: user?.id || null,
        },
      });

      return resolve(NextResponse.json({ message: 'Upload success' }, { status: 200 }));
    });
  });
}
