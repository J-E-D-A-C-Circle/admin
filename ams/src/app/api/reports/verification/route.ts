import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, stations } from '@/db/schema';
import { eq, and, count as countFn, isNotNull, sql } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get('regionId');
    const stationId = searchParams.get('stationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions = [];
    if (regionId) conditions.push(eq(stations.regionId, parseInt(regionId)));
    if (stationId) conditions.push(eq(stations.id, parseInt(stationId)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const stationsList = await db.select().from(stations).where(whereClause).orderBy(stations.name);

    const report = [];

    for (const s of stationsList) {
      // 1. Total assets registered in this station (Expected)
      const [expectedRes] = await db
        .select({ value: countFn() })
        .from(assets)
        .where(eq(assets.stationId, s.id));
      const expected = expectedRes?.value || 0;

      // 2. Verified assets in this station (Active and lastVerificationDate not null)
      const verifiedConditions = [
        eq(assets.stationId, s.id),
        eq(assets.status, 'Active'),
        isNotNull(assets.lastVerificationDate),
      ];
      if (startDate) verifiedConditions.push(sql`${assets.lastVerificationDate} >= ${startDate}`);
      if (endDate) verifiedConditions.push(sql`${assets.lastVerificationDate} <= ${endDate}`);

      const [verifiedRes] = await db
        .select({ value: countFn() })
        .from(assets)
        .where(and(...verifiedConditions));
      const verified = verifiedRes?.value || 0;

      // 3. Missing assets in this station
      const [missingRes] = await db
        .select({ value: countFn() })
        .from(assets)
        .where(and(eq(assets.stationId, s.id), eq(assets.status, 'Missing')));
      const missing = missingRes?.value || 0;

      const rate = expected > 0 ? parseFloat(((verified / expected) * 100).toFixed(1)) : 0;

      report.push({
        stationName: s.name,
        assetsExpected: expected,
        assetsVerified: verified,
        assetsMissing: missing,
        verificationRate: rate,
      });
    }

    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Fetch verification report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
