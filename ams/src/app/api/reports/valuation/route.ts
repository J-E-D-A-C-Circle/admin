import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, assetCategories, regions, stations } from '@/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { verifyAuth, getScopeWhere, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { calcDepreciation } from '@/lib/utils';

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

    const conditions = [ne(assets.status, 'Obsolete'), ne(assets.status, 'Auctioned')];
    if (scope.regionId) conditions.push(eq(assets.regionId, scope.regionId));
    if (scope.stationId) conditions.push(eq(assets.stationId, scope.stationId));
    if (regionId && !scope.regionId) conditions.push(eq(assets.regionId, parseInt(regionId, 10)));
    if (stationId && !scope.stationId) conditions.push(eq(assets.stationId, parseInt(stationId, 10)));
    if (categoryId) conditions.push(eq(assets.categoryId, parseInt(categoryId, 10)));
    if (startDate) conditions.push(sql`${assets.acquisitionDate} >= ${startDate}`);
    if (endDate) conditions.push(sql`${assets.acquisitionDate} <= ${endDate}`);

    const rows = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        categoryName: assetCategories.name,
        regionName: regions.name,
        stationName: stations.name,
        status: assets.status,
        purchaseValue: assets.purchaseValue,
        acquisitionDate: assets.acquisitionDate,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(regions, eq(assets.regionId, regions.id))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .where(and(...conditions))
      .orderBy(assets.assetId);

    let assetsWithCost = 0;
    let totalOriginalCost = 0;
    let totalDepreciation = 0;
    let totalNetBookValue = 0;

    const data = rows.map((r) => {
      const dep = calcDepreciation(r.purchaseValue, r.acquisitionDate, r.categoryName || '');
      if (dep) {
        assetsWithCost++;
        totalOriginalCost += dep.purchaseValue;
        totalDepreciation += dep.depreciationAmount;
        totalNetBookValue += dep.bookValue;
      }

      return {
        assetId: r.assetId,
        name: r.name,
        categoryName: r.categoryName || 'N/A',
        stationName: r.stationName || 'N/A',
        acquisitionDate: r.acquisitionDate ? new Date(r.acquisitionDate).toISOString().split('T')[0] : 'N/A',
        originalCost: dep ? `GHS ${dep.purchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Not Recorded',
        depreciationRate: dep ? `${dep.ratePercent}% / yr` : 'N/A',
        accumulatedDepreciation: dep ? `GHS ${dep.depreciationAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A',
        netBookValue: dep ? `GHS ${dep.bookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A',
      };
    });

    return NextResponse.json({
      data,
      summary: {
        totalAssets: data.length,
        valuedAssets: `${assetsWithCost} of ${data.length}`,
        totalOriginalCost: `GHS ${totalOriginalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalDepreciation: `GHS ${totalDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalNetBookValue: `GHS ${totalNetBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fetch valuation report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
