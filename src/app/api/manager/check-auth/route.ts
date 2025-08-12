import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const managerAuth = cookieStore.get('manager-auth');
    const managerEmail = cookieStore.get('manager-email');
    
    if (!managerAuth || managerAuth.value !== 'true' || !managerEmail) {
      return NextResponse.json({ error: 'Manager not authenticated' }, { status: 401 });
    }
    
    // Get the manager's ID from their email
    const manager = await prisma.user.findUnique({
      where: { email: managerEmail.value },
      select: { id: true, name: true, email: true, role: true }
    });
    
    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      managerId: manager.id,
      managerName: manager.name,
      managerEmail: manager.email
    });
  } catch (error) {
    console.error('Error checking manager auth:', error);
    return NextResponse.json({ error: 'Authentication check failed' }, { status: 500 });
  }
}
