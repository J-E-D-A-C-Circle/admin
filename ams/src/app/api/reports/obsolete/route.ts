import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, stations, assetCategories, disposals, users } from '@/db/schema';
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

    const conditions = [eq(assets.status, 'Obsolete')];
    if (regionId) conditions.push(eq(assets.regionId, parseInt(regionId, 10)));
    if (stationId) conditions.push(eq(assets.stationId, parseInt(stationId, 10)));
    if (categoryId) conditions.push(eq(assets.categoryId, parseInt(categoryId, 10)));
    if (startDate) conditions.push(sql`${assets.updatedAt} >= ${startDate}`);
    if (endDate) conditions.push(sql`${assets.updatedAt} <= ${endDate}`);

    const rows = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        category: assetCategories.name,
        location: stations.name,
        purchaseValue: assets.purchaseValue,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .where(and(...conditions))
      .orderBy(assets.assetId);

    const formatted = [];
    for (const a of rows) {
      const [disposal] = await db
        .select({
          disposalMethod: disposals.disposalMethod,
          disposalDate: disposals.disposalDate,
          realisedValue: disposals.realisedValue,
          notes: disposals.notes,
          authorisedBy: users.name,
        })
        .from(disposals)
        .leftJoin(users, eq(disposals.authorisedByUserId, users.id))
        .where(eq(disposals.assetId, a.assetId))
        .orderBy(sql`${disposals.disposalDate} DESC`)
        .limit(1);

      formatted.push({
        assetId: a.assetId,
        name: a.name,
        category: a.category || '—',
        location: a.location || '—',
        disposalMethod: disposal?.disposalMethod?.replace('_', ' ') || 'Marked Obsolete',
        disposalDate: disposal?.disposalDate || a.updatedAt,
        purchaseValue: a.purchaseValue ? `GHS ${a.purchaseValue}` : '—',
        realisedValue: disposal?.realisedValue ? `GHS ${disposal.realisedValue}` : '—',
        authorisedBy: disposal?.authorisedBy || '—',
        notes: disposal?.notes || '—',
      });
    }

    return NextResponse.json(formatted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fetch obsolete report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
