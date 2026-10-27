import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assetHistory, users, stations, roles } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const result = await db
      .select({
        userId: users.id,
        name: users.name,
        role: roles.name,
        stationName: stations.name,
        actionCount: sql<number>`count(${assetHistory.id})`,
      })
      .from(users)
      .innerJoin(assetHistory, eq(assetHistory.userId, users.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(stations, eq(users.stationId, stations.id))
      .groupBy(users.id, roles.name, stations.name)
      .orderBy(desc(sql`count(${assetHistory.id})`))
      .limit(10);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Fetch activity leaderboard error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
