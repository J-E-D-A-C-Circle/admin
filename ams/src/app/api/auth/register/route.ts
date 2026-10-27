import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyAuth, forbiddenResponse, unauthorizedResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  name: z.string().min(1),
  email: z.string().email(),
  roleId: z.number().int().positive(),
  regionId: z.number().int().positive().optional().nullable(),
  stationId: z.number().int().positive().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin') return forbiddenResponse('Only Super Admins can register new users');

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { username, password, name, email, roleId, regionId, stationId } = parsed.data;

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const [inserted] = await db.insert(users).values({
        username,
        passwordHash,
        name,
        email,
        roleId,
        regionId: regionId ?? null,
        stationId: stationId ?? null,
      });

      await logAudit('Created User', caller.sub, req, `User: ${username}`);
      return NextResponse.json({ id: inserted.insertId, username }, { status: 201 });
    } catch (dbErr: any) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ message: 'Username or email already exists' }, { status: 409 });
      }
      throw dbErr;
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
