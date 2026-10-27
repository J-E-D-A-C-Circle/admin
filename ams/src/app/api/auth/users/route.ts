import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, roles, regions, stations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, forbiddenResponse, unauthorizedResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin') return forbiddenResponse('Access restricted to Super Admins');

    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
        roleName: roles.name,
        regionId: users.regionId,
        regionName: regions.name,
        stationId: users.stationId,
        stationName: stations.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(regions, eq(users.regionId, regions.id))
      .leftJoin(stations, eq(users.stationId, stations.id))
      .orderBy(users.createdAt);

    return NextResponse.json(allUsers);
  } catch (err: any) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
