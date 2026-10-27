import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.errors }, { status: 400 });
    }

    const { username, password } = parsed.data;

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

    const token = generateToken({
      sub: user.id,
      username: user.username,
      role: user.roleName || 'Auditor',
      regionId: user.regionId,
      stationId: user.stationId,
    });

    await logAudit('Login Success', user.id, req, `User: ${user.username}`);

    return NextResponse.json({
      token,
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.roleName,
      regionId: user.regionId,
      stationId: user.stationId,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
