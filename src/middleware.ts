import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userData = rateLimitStore.get(ip);
  
  if (!userData || now > userData.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (userData.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  userData.count++;
  return false;
}

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limiting
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/manager/login',
    '/manager/register',
    '/admin/login',
    '/api/login',
    '/api/signup',
    '/api/manager/login',
    '/api/manager/register',
    '/api/admin/login',
  ];

  // Check if it's a public route
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Admin routes protection
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const adminAuth = request.cookies.get('admin-auth');
    
    if (!adminAuth || adminAuth.value !== 'true') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Manager routes protection
  if (pathname.startsWith('/manager') || pathname.startsWith('/api/manager')) {
    // Skip auth check for login/register pages
    if (pathname === '/manager/login' || pathname === '/manager/register') {
      return NextResponse.next();
    }
    
    const managerAuth = request.cookies.get('manager-auth');
    
    if (!managerAuth || managerAuth.value !== 'true') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/manager/login', request.url));
    }
  }

  // Protected API routes that need user authentication
  if (pathname.startsWith('/api/upload') || pathname.startsWith('/api/get-uploads')) {
    // Check for user email in headers (set by frontend after login)
    const userEmail = request.headers.get('x-user-email');
    if (!userEmail || userEmail === 'unknown@example.com') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
  }

  // Dashboard protection
  if (pathname === '/dashboard') {
    const userEmail = request.headers.get('x-user-email');
    if (!userEmail || userEmail === 'unknown@example.com') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
