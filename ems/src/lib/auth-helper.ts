import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dvla-ghana-post-ems-expenditure-jwt-secret-key-2026-standalone';

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  regionId: number | null;
  stationId: number | null;
}

export function verifyAuth(req: NextRequest): JwtPayload | null {
  // Check Authorization Header
  const authHeader = req.headers.get('Authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    // Check Cookie fallback
    token = req.cookies.get('ems_token')?.value || req.cookies.get('dams_token')?.value || null;
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function forbiddenResponse(message = 'Access denied') {
  return NextResponse.json({ message }, { status: 403 });
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ message }, { status: 401 });
}

export function checkRole(user: JwtPayload, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function getScopeWhere(user: JwtPayload): { regionId?: number; stationId?: number } {
  return {};
}
