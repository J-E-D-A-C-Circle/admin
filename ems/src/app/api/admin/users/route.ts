import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq, desc, isNull } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const rows = await db
      .select({
        id: s.users.id,
        username: s.users.username,
        email: s.users.email,
        name: s.users.name,
        roleId: s.users.roleId,
        roleName: s.roles.name,
        regionId: s.users.regionId,
        regionName: s.regions.name,
        stationId: s.users.stationId,
        stationName: s.stations.name,
        createdAt: s.users.createdAt,
        deletedAt: s.users.deletedAt,
      })
      .from(s.users)
      .leftJoin(s.roles, eq(s.users.roleId, s.roles.id))
      .leftJoin(s.regions, eq(s.users.regionId, s.regions.id))
      .leftJoin(s.stations, eq(s.users.stationId, s.stations.id))
      .orderBy(desc(s.users.id));

    const usersList = rows.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      name: u.name,
      roleId: u.roleId,
      roleName: u.roleName,
      regionId: u.regionId,
      regionName: u.regionName || 'All Regions',
      stationId: u.stationId,
      stationName: u.stationName || 'All Stations / HQ',
      status: u.deletedAt ? 'SUSPENDED' : 'ACTIVE',
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ success: true, users: usersList });
  } catch (err: any) {
    console.error('Admin Users GET Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const body = await req.json();
    const { username, email, name, password, roleId, regionId, stationId } = body;

    if (!username || !email || !name || !password || !roleId) {
      return NextResponse.json(
        { success: false, error: 'Full name, username, email, password, and role are required.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const [existing] = await db
      .select({ id: s.users.id })
      .from(s.users)
      .where(eq(s.users.username, cleanUsername))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Username '${cleanUsername}' is already taken.` },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const [inserted] = await db.insert(s.users).values({
      username: cleanUsername,
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
      roleId: parseInt(roleId),
      regionId: regionId ? parseInt(regionId) : null,
      stationId: stationId ? parseInt(stationId) : null,
    });

    await logAudit('Create EMS User', caller.sub, req, `Created user ${cleanUsername}`);

    return NextResponse.json({ success: true, message: 'User created successfully', id: inserted.insertId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
