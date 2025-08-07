import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    // Generate a signed URL for viewing the image
    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUrl(fileName, 60 * 60); // 1 hour expiry for viewing

    if (error) {
      console.error('❌ Signed URL error:', error);
      return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });

  } catch (error) {
    console.error('❌ Get image URL error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
