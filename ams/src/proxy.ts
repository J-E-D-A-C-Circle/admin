import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-dvla-dams-jwt-secret-key-2026';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/assets',
  '/transfers',
  '/verifications',
  '/reports',
  '/settings',
  '/import',
  '/map',
  '/audit-logs',
];

function isValidToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get('dams_token')?.value;
  if (!token || !isValidToken(token)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    if (token) {
      res.cookies.delete('dams_token');
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/assets/:path*',
    '/transfers/:path*',
    '/verifications/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/import/:path*',
    '/map/:path*',
    '/audit-logs/:path*',
  ],
};

