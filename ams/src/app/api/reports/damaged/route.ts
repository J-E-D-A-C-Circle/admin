import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, stations, assetVerifications } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get('regionId');
    const stationId = searchParams.get('stationId');
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions = [eq(assets.status, 'Damaged')];
    if (regionId) conditions.push(eq(assets.regionId, parseInt(regionId)));
    if (stationId) conditions.push(eq(assets.stationId, parseInt(stationId)));
    if (categoryId) conditions.push(eq(assets.categoryId, parseInt(categoryId)));
    if (startDate) conditions.push(sql`${assets.updatedAt} >= ${startDate}`);
    if (endDate) conditions.push(sql`${assets.updatedAt} <= ${endDate}`);

    const whereClause = and(...conditions);

    // Fetch damaged assets
    const damagedAssets = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        stationName: stations.name,
        updatedAt: assets.updatedAt,
        status: assets.status,
      })
      .from(assets)
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .where(whereClause)
      .orderBy(assets.assetId);

    // Fetch last verification comments for each damaged asset
    const formatted = [];
    for (const a of damagedAssets) {
      const lastVerification = await db
        .select({
          verificationDate: assetVerifications.verificationDate,
          comments: assetVerifications.comments,
        })
        .from(assetVerifications)
        .where(and(eq(assetVerifications.assetId, a.assetId), eq(assetVerifications.status, 'Damaged')))
        .orderBy(sql`${assetVerifications.verificationDate} DESC`)
        .limit(1);

      const auditRecord = lastVerification[0];
      formatted.push({
        assetId: a.assetId,
        name: a.name,
        location: a.stationName,
        damageDate: auditRecord?.verificationDate || a.updatedAt,
        currentStatus: a.status,
        comments: auditRecord?.comments || null,
      });
    }

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Fetch damaged report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
