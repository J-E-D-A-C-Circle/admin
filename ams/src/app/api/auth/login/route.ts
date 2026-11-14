import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';
import { ensureSchema } from '@/lib/ensureSchema';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.errors }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateKey = `login:${ip}:${username.toLowerCase()}`;
    const limit = checkRateLimit(rateKey, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      await logAudit('Login Rate Limited', null, req, username);
      return NextResponse.json(
        { message: `Too many failed login attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minute(s).` },
        { status: 429 }
      );
    }

    // Fetch user with role name
    const userList = await db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
        regionId: users.regionId,
        stationId: users.stationId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.username, username))
      .limit(1);

    const user = userList[0];

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      await logAudit('Login Failed', null, req, username);
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    if (user.isActive === false) {
      await logAudit('Login Blocked (Disabled Account)', user.id, req, username);
      return NextResponse.json(
        { message: 'This account has been disabled. Contact a Super Admin.' },
        { status: 403 }
      );
    }

    resetRateLimit(rateKey);
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const token = generateToken({
      sub: user.id,
      username: user.username,
      role: user.roleName || 'Auditor',
      regionId: user.regionId,
      stationId: user.stationId,
    });

    await logAudit('Login Success', user.id, req, `User: ${user.username}`);

    const res = NextResponse.json({
      token,
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.roleName,
      regionId: user.regionId,
      stationId: user.stationId,
    });

    const isHttps =
      req.nextUrl.protocol === 'https:' ||
      req.headers.get('x-forwarded-proto') === 'https';

    res.cookies.set('dams_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttps,
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
