import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jobnest_jwt_secret_please_change_in_production_min64chars_xxxx'
);

// Paths that never require authentication
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/verify-otp',
  '/auth/forgot-password',
  '/auth/register',
  '/auth/reset-password',
  '/public',          // public form links: /public/form/[id]
  '/unauthorized',
  '/docs',
  '/about',
  '/integrations',
  '/changelog',
  '/careers',
  '/blog',
  '/press',
  '/help-center',
  '/status',
  '/privacy',
  '/terms',
  '/security',
  '/compliance',
];

const ROLE_DASHBOARD: Record<string, string> = {
  'Super Admin':        '/super-admin/dashboard',
  'Admin':              '/admin/dashboard',
  'Sales Manager':      '/sales-manager/dashboard',
  'Sales Executive':    '/sales-executive/dashboard',
  'Marketing Head':     '/marketing/dashboard',
  'Marketing Executive':'/marketing/dashboard',
  'Support Manager':    '/support/dashboard',
  'Support Agent':      '/support/dashboard',
  'Finance Executive':  '/finance/dashboard',
};

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always pass through static files and Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // /public/* is always accessible (unauthenticated public forms etc.)
  if (pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  // Other public paths — always allow
  if (isPublicPath(pathname)) {
    // If user is already logged in, redirect them to their dashboard
    const token = request.cookies.get('accessToken')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        const role = payload.role as string;
        const dashboard = ROLE_DASHBOARD[role];
        if (dashboard && pathname !== '/') {
          return NextResponse.redirect(new URL(dashboard, request.url));
        }
      } catch {
        // Invalid token — let them through to the login page
      }
    }
    return NextResponse.next();
  }

  // Root path — redirect authenticated users to their dashboard
  if (pathname === '/') {
    const token = request.cookies.get('accessToken')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        const role = payload.role as string;
        const dashboard = ROLE_DASHBOARD[role];
        if (dashboard) return NextResponse.redirect(new URL(dashboard, request.url));
      } catch {
        // Ignore — show landing page
      }
    }
    return NextResponse.next();
  }

  // ── All routes below require authentication ────────────────────────────────
  const token =
    request.cookies.get('accessToken')?.value ||
    request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Per-role path guards
    if (pathname.startsWith('/super-admin') && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (pathname.startsWith('/admin') && role !== 'Admin' && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (
      pathname.startsWith('/sales-manager') &&
      role !== 'Sales Manager' && role !== 'Admin' && role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (
      pathname.startsWith('/sales-executive') &&
      role !== 'Sales Executive' && role !== 'Sales Manager' && role !== 'Admin' && role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (
      pathname.startsWith('/sales') &&
      role !== 'Sales Executive' && role !== 'Sales Manager' && role !== 'Admin' && role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (
      pathname.startsWith('/marketing') &&
      role !== 'Marketing Head' && role !== 'Marketing Executive' && role !== 'Admin' && role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (
      pathname.startsWith('/support') &&
      role !== 'Support Manager' && role !== 'Support Agent' && role !== 'Admin' && role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (
      pathname.startsWith('/finance') &&
      role !== 'Finance Executive' && role !== 'Admin' && role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // /dashboard → redirect to role-specific dashboard
    if (pathname.startsWith('/dashboard')) {
      const dashboard = ROLE_DASHBOARD[role];
      if (dashboard) return NextResponse.redirect(new URL(dashboard, request.url));
    }

    return NextResponse.next();
  } catch {
    // Token invalid or expired
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('accessToken');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
