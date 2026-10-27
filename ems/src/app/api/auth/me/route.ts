import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';
import { db } from '@/db';
import * as s from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const auth = verifyAuth(req);
    if (!auth) return unauthorizedResponse();

    let userDetails = null;
    try {
      const [u] = await db
        .select({
          id: s.users.id,
          username: s.users.username,
          name: s.users.name,
          email: s.users.email,
          role: s.roles.name,
          regionId: s.users.regionId,
          regionName: s.regions.name,
          stationId: s.users.stationId,
          stationName: s.stations.name,
        })
        .from(s.users)
        .leftJoin(s.roles, eq(s.users.roleId, s.roles.id))
        .leftJoin(s.regions, eq(s.users.regionId, s.regions.id))
        .leftJoin(s.stations, eq(s.users.stationId, s.stations.id))
        .where(eq(s.users.id, auth.sub))
        .limit(1);

      userDetails = u;
    } catch {}

    return NextResponse.json({
      success: true,
      user: userDetails || {
        id: auth.sub,
        username: auth.username,
        role: auth.role,
        regionId: auth.regionId,
        stationId: auth.stationId,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
