import { NextRequest, NextResponse } from 'next/server';
import formidable, { IncomingForm } from 'formidable';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  const mockReq: any = Object.assign(stream, {
    headers: {
      'content-type': contentType,
      'content-length': contentLength,
    },
    method: 'POST',
    url: '',
  });

  const form = new IncomingForm({ uploadDir, keepExtensions: true });

  return new Promise((resolve) => {
    form.parse(mockReq, async (err, fields, files) => {
      if (err) {
        console.error('❌ Upload error:', err);
        return resolve(NextResponse.json({ message: 'Upload failed' }, { status: 500 }));
      }

      console.log('📦 Parsed files:', files);
      const file = files?.document?.[0];

      if (!file) {
        return resolve(NextResponse.json({ message: 'Missing file' }, { status: 400 }));
      }

      const fileId = uuidv4();
      const newFileName = `${fileId}_${file.originalFilename}`;
      const newFilePath = path.join(uploadDir, newFileName);

      fs.renameSync(file.filepath, newFilePath);

      const publicUrl = `/uploads/${newFileName}`;

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
