import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'expense_tracker_secret_key_2026_super_secure_9988'
);

const COOKIE_NAME = 'et_auth_session';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/change-password'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through static assets, API routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  const token = req.cookies.get(COOKIE_NAME)?.value;

  let session: any = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload;
    } catch {
      session = null;
    }
  }

  // 1. Unauthenticated access to any protected route → redirect to /login
  if (!session && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname === '/' ? '' : pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user accessing login/forgot-password → redirect to dashboard (/)
  if (session && (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 3. Force password change — only /change-password is accessible
  if (session && session.mustChangePassword && pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password', req.url));
  }

  // 4. Non-admin attempting to access admin-only routes → redirect to /
  if (session && session.role !== 'ADMIN' && (pathname.startsWith('/users') || pathname.startsWith('/audit-logs'))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
