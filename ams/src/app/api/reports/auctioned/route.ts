import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, assetCategories, regions, stations, departments, disposals } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { verifyAuth, getScopeWhere, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Auditor' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Access denied');
    }

    const scope = getScopeWhere(caller);
    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get('regionId');
    const stationId = searchParams.get('stationId');
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions = [eq(assets.status, 'Auctioned')];
    if (scope.regionId) conditions.push(eq(assets.regionId, scope.regionId));
    if (scope.stationId) conditions.push(eq(assets.stationId, scope.stationId));
    if (regionId && !scope.regionId) conditions.push(eq(assets.regionId, parseInt(regionId, 10)));
    if (stationId && !scope.stationId) conditions.push(eq(assets.stationId, parseInt(stationId, 10)));
    if (categoryId) conditions.push(eq(assets.categoryId, parseInt(categoryId, 10)));
    if (startDate) conditions.push(sql`COALESCE(${disposals.disposalDate}, ${assets.updatedAt}) >= ${startDate}`);
    if (endDate) conditions.push(sql`COALESCE(${disposals.disposalDate}, ${assets.updatedAt}) <= ${endDate}`);

    const rows = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        categoryName: assetCategories.name,
        regionName: regions.name,
        stationName: stations.name,
        departmentName: departments.name,
        purchaseValue: assets.purchaseValue,
        realisedValue: disposals.realisedValue,
        disposalDate: disposals.disposalDate,
        notes: disposals.notes,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(regions, eq(assets.regionId, regions.id))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(departments, eq(assets.departmentId, departments.id))
      .leftJoin(disposals, eq(assets.assetId, disposals.assetId))
      .where(and(...conditions))
      .orderBy(desc(assets.updatedAt));

    let totalRealised = 0;
    const data = rows.map((r) => {
      const realisedNum = r.realisedValue ? Number.parseFloat(String(r.realisedValue)) : 0;
      if (Number.isFinite(realisedNum) && realisedNum > 0) totalRealised += realisedNum;

      return {
        assetId: r.assetId,
        name: r.name,
        categoryName: r.categoryName || 'N/A',
        stationName: r.stationName || 'N/A',
        departmentName: r.departmentName || 'N/A',
        purchaseValue: r.purchaseValue ? `GHS ${Number(r.purchaseValue).toLocaleString()}` : 'Not Recorded',
        realisedValue: r.realisedValue ? `GHS ${Number(r.realisedValue).toLocaleString()}` : 'Not Recorded',
        auctionDate: r.disposalDate
          ? new Date(r.disposalDate).toISOString().split('T')[0]
          : new Date(r.updatedAt).toISOString().split('T')[0],
        notes: r.notes || '—',
      };
    });

    return NextResponse.json({
      data,
      summary: {
        totalAuctioned: data.length,
        totalRealisedValue: `GHS ${totalRealised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fetch auctioned report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
