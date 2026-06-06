import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Auth pages that never require a token
const AUTH_PUBLIC_PATHS = [
  '/auth/login',
  '/auth/verify-otp',
  '/auth/forgot-password',
  '/unauthorized',
];

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  'Super Admin': '/super-admin/dashboard',
  'Admin': '/admin/dashboard',
  'Sales Manager': '/sales-manager/dashboard',
  'Sales Executive': '/sales/dashboard',
  'Marketing Head': '/marketing/dashboard',
  'Marketing Executive': '/marketing/dashboard',
  'Support Manager': '/support/dashboard',
  'Support Agent': '/support/dashboard',
  'Finance Executive': '/finance/dashboard',
};

const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always pass through static files, Next internals, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Root path — redirect to role dashboard if a valid token is present
  if (pathname === '/') {
    const token = request.cookies.get('accessToken')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        const role = payload.role as string;
        const dashboard = ROLE_DASHBOARD_MAP[role];
        if (dashboard) {
          return NextResponse.redirect(new URL(dashboard, request.url));
        }
      } catch {
        // Token invalid or expired — show landing page
      }
    }
    return NextResponse.next();
  }

  // Auth-related public paths — always allow through
  if (AUTH_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // ── Protected routes below this line ─────────────────────────────────────

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

    // /super-admin/*
    if (pathname.startsWith('/super-admin') && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // /admin/*
    if (pathname.startsWith('/admin') && role !== 'Admin' && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // /sales-manager/*
    if (
      pathname.startsWith('/sales-manager') &&
      role !== 'Sales Manager' &&
      role !== 'Admin' &&
      role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // /sales/*
    if (
      pathname.startsWith('/sales') &&
      role !== 'Sales Executive' &&
      role !== 'Sales Manager' &&
      role !== 'Admin' &&
      role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // /marketing/*
    if (
      pathname.startsWith('/marketing') &&
      role !== 'Marketing Head' &&
      role !== 'Marketing Executive' &&
      role !== 'Admin' &&
      role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // /support/*
    if (
      pathname.startsWith('/support') &&
      role !== 'Support Manager' &&
      role !== 'Support Agent' &&
      role !== 'Admin' &&
      role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // /finance/*
    if (
      pathname.startsWith('/finance') &&
      role !== 'Finance Executive' &&
      role !== 'Admin' &&
      role !== 'Super Admin'
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // /dashboard — redirect to role-specific dashboard
    if (pathname.startsWith('/dashboard')) {
      const dashboard = ROLE_DASHBOARD_MAP[role];
      if (dashboard) {
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Token invalid or expired — clear cookie and redirect to login
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('accessToken');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
