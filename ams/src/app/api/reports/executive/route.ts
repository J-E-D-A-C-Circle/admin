import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, stations, regions, assetCategories } from '@/db/schema';
import { eq, and, count as countFn, isNotNull, desc } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    // 1. Core KPIs
    const [totalRes] = await db.select({ value: countFn() }).from(assets);
    const total = totalRes?.value || 0;

    const [verifiedRes] = await db
      .select({ value: countFn() })
      .from(assets)
      .where(and(eq(assets.status, 'Active'), isNotNull(assets.lastVerificationDate)));
    const verified = verifiedRes?.value || 0;

    const missing = 0;

    const [damagedRes] = await db.select({ value: countFn() }).from(assets).where(eq(assets.status, 'Damaged'));
    const damaged = damagedRes?.value || 0;

    const verificationPercentage = total > 0 ? parseFloat(((verified / total) * 100).toFixed(1)) : 0;

    // 2. Assets by Region
    const regionGroups = await db
      .select({ regionId: assets.regionId, count: countFn() })
      .from(assets)
      .groupBy(assets.regionId);
    const regionsList = await db.select().from(regions);
    const assetsByRegion = regionGroups.map(rg => ({
      name: regionsList.find(r => r.id === rg.regionId)?.name || 'Unknown',
      value: rg.count,
    }));

    // 3. Assets by Category
    const categoryGroups = await db
      .select({ categoryId: assets.categoryId, count: countFn() })
      .from(assets)
      .groupBy(assets.categoryId);
    const categoriesList = await db.select().from(assetCategories);
    const assetsByCategory = categoryGroups.map(cg => ({
      name: categoriesList.find(c => c.id === cg.categoryId)?.name || 'Unknown',
      value: cg.count,
    }));

    // 4. Top Stations with Missing Assets (removed from asset status)
    const topStationsMissing: { stationName: string; count: number }[] = [];
    const stationsList = await db.select().from(stations);

    // 5. Top Stations with Most Assets
    const topAssetGroups = await db
      .select({ stationId: assets.stationId, count: countFn() })
      .from(assets)
      .groupBy(assets.stationId)
      .orderBy(desc(countFn()))
      .limit(5);
    const topStationsAssets = topAssetGroups.map(t => ({
      stationName: stationsList.find(s => s.id === t.stationId)?.name || 'Unknown',
      count: t.count,
    }));

    return NextResponse.json({
      totalAssets: total,
      verifiedAssets: verified,
      missingAssets: missing,
      damagedAssets: damaged,
      verificationPercentage,
      assetsByRegion,
      assetsByCategory,
      topStationsMissing,
      topStationsAssets,
    });
  } catch (err: any) {
    console.error('Fetch executive summary error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
