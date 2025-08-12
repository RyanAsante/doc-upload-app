import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('manager-auth');
  cookieStore.delete('manager-email');
  
  return NextResponse.json({ success: true, message: 'Manager logged out' });
}
