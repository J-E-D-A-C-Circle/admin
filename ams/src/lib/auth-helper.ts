import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-dvla-dams-jwt-secret-key-2026';

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  regionId: number | null;
  stationId: number | null;
}

export function verifyAuth(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
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
export function getScopeWhere(user: JwtPayload): { regionId?: number; stationId?: number } {
  const where: { regionId?: number; stationId?: number } = {};
  if (user.role === 'Regional Manager' && user.regionId !== null) {
    where.regionId = user.regionId;
  }
  if (user.role === 'Station Manager' && user.stationId !== null) {
    where.stationId = user.stationId;
  }
  return where;
}
