import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jobnest_jwt_secret_please_change_in_production_min64chars_xxxx'
);

// Routes that are publicly accessible (no auth required)
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/verify-otp',
  '/public',
  '/',
];

// Role → home route mapping
const ROLE_REDIRECTS: Record<string, string> = {
  'Super Admin': '/super-admin/dashboard',
  'Admin': '/admin/dashboard',
  'Marketing Head': '/marketing/dashboard',
  'Marketing Executive': '/marketing/dashboard',
  'Sales Manager': '/sales-manager/dashboard',
  'Sales Executive': '/sales-executive/dashboard',
};

// Role → allowed path prefixes
const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  'Super Admin': ['/super-admin', '/admin', '/marketing', '/sales-manager', '/sales-executive'],
  'Admin': ['/admin', '/marketing'],
  'Marketing Head': ['/marketing'],
  'Marketing Executive': ['/marketing'],
  'Sales Manager': ['/sales-manager', '/sales-executive'],
  'Sales Executive': ['/sales-executive'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  const token =
    request.cookies.get('accessToken')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  // No token — redirect to login unless public
  if (!token) {
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT
  let payload: { role?: string; userId?: string } = {};
  try {
    const { payload: p } = await jwtVerify(token, JWT_SECRET);
    payload = p as typeof payload;
  } catch {
    // Invalid / expired token
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('accessToken');
    return res;
  }

  const role = payload.role || '';

  // Already authenticated on auth pages → redirect to role home
  // But allow /public/* even when authenticated (public forms are always viewable)
  if (isPublic && token && !pathname.startsWith('/public')) {
    const home = ROLE_REDIRECTS[role] || '/';
    if (pathname !== home) {
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  // /public/* routes are always accessible regardless of auth state
  if (pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  // Check if role is allowed to access this path
  const allowedPrefixes = ROLE_ALLOWED_PATHS[role] || [];
  const canAccess = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!canAccess) {
    const home = ROLE_REDIRECTS[role] || '/auth/login';
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
