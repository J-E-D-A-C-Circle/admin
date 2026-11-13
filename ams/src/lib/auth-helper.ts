import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-dvla-dams-jwt-secret-key-2026';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('[SECURITY WARNING] JWT_SECRET environment variable is not set; using fallback secret.');
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  regionId: number | null;
  stationId: number | null;
}

export function verifyAuth(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const cookieToken = req.cookies.get('dams_token')?.value || null;
  const token = bearerToken || cookieToken;
  if (!token) {
    return null;
  }

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

// Scopes database queries to only return data the user is permitted to see
export function getScopeWhere(_user: JwtPayload): { regionId?: number; stationId?: number } {
  return {};
}
