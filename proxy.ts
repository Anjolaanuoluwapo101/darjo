import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'darjo_session';

// Pages that need a session cookie. API routes still verify the cookie themselves.
const PROTECTED = [
  /^\/studio(?:\/|$)/,
  /^\/circles(?:\/|$)/,
  /^\/join(?:\/|$)/,
  /^\/profile(?:\/|$)/,
  /^\/assistant(?:\/|$)/,
];

// Auth pages a signed-in visitor should skip.
const AUTH_PAGES = [/^\/login(?:\/|$)/, /^\/signup(?:\/|$)/];

export function proxy(request: NextRequest) {
  // Mock mode has no real session cookie, so gating would lock developers out.
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && PROTECTED.some((pattern) => pattern.test(pathname))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (hasSession && AUTH_PAGES.some((pattern) => pattern.test(pathname))) {
    const url = request.nextUrl.clone();
    url.pathname = '/studio';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/studio/:path*',
    '/circles/:path*',
    '/join/:path*',
    '/profile/:path*',
    '/assistant/:path*',
    '/login',
    '/signup',
  ],
};
