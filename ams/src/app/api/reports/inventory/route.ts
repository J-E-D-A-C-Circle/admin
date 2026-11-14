import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, assetCategories, assetSubcategories, regions, stations, departments, employees } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, getScopeWhere } from '@/lib/auth-helper';
import { ensureSchema } from '@/lib/ensureSchema';

function parsePositiveInt(val: string | null): number | null {
  if (!val || val === 'all') return null;
  const parsed = Number.parseInt(val, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    await ensureSchema();

    const { searchParams } = new URL(req.url);
    const regionId = parsePositiveInt(searchParams.get('regionId'));
    const stationId = parsePositiveInt(searchParams.get('stationId'));
    const categoryId = parsePositiveInt(searchParams.get('categoryId'));
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const scope = getScopeWhere(caller);
    const conditions: any[] = [];

    if (scope.regionId) conditions.push(eq(assets.regionId, scope.regionId));
    else if (regionId) conditions.push(eq(assets.regionId, regionId));

    if (scope.stationId) conditions.push(eq(assets.stationId, scope.stationId));
    else if (stationId) conditions.push(eq(assets.stationId, stationId));

    if (categoryId) conditions.push(eq(assets.categoryId, categoryId));

    if (startDate) {
      const start = new Date(startDate);
      if (!Number.isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        conditions.push(gte(assets.acquisitionDate, start));
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(assets.acquisitionDate, end));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        categoryName: assetCategories.name,
        subcategoryName: assetSubcategories.name,
        brand: assets.brand,
        model: assets.model,
        serialNumber: assets.serialNumber,
        status: assets.status,
        regionName: regions.name,
        stationName: stations.name,
        departmentName: departments.name,
        assignedEmployeeName: employees.name,
        purchaseValue: assets.purchaseValue,
        acquisitionDate: assets.acquisitionDate,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(assetSubcategories, eq(assets.subcategoryId, assetSubcategories.id))
      .leftJoin(regions, eq(assets.regionId, regions.id))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(departments, eq(assets.departmentId, departments.id))
      .leftJoin(employees, eq(assets.assignedEmployeeId, employees.id))
      .where(whereClause)
      .orderBy(desc(assets.createdAt));

    // Compute explanatory summary & chart aggregations
    let totalValue = 0;
    let activeCount = 0;
    let maintenanceCount = 0;
    let damagedCount = 0;
    const missingCount = 0;
    let obsoleteCount = 0;
    let auctionedCount = 0;
    let assignedCount = 0;

    const catMap = new Map<string, { name: string; count: number; value: number }>();
    const stationMap = new Map<string, { name: string; count: number; value: number }>();
    const regionMap = new Map<string, { name: string; count: number; value: number }>();

    for (const row of data) {
      const price = Number.parseFloat(String(row.purchaseValue || '0')) || 0;
      totalValue += price;

      if (row.status === 'Active') activeCount++;
      else if (row.status === 'Under_Maintenance') maintenanceCount++;
      else if (row.status === 'Damaged') damagedCount++;
      else if (row.status === 'Obsolete') obsoleteCount++;
      else if (row.status === 'Auctioned') auctionedCount++;

      if (row.assignedEmployeeName) assignedCount++;

      const catKey = row.categoryName || 'Uncategorized';
      const catEntry = catMap.get(catKey) || { name: catKey, count: 0, value: 0 };
      catEntry.count += 1;
      catEntry.value += price;
      catMap.set(catKey, catEntry);

      const stKey = row.stationName || 'Unassigned Station';
      const stEntry = stationMap.get(stKey) || { name: stKey, count: 0, value: 0 };
      stEntry.count += 1;
      stEntry.value += price;
      stationMap.set(stKey, stEntry);

      const regKey = row.regionName || 'Unassigned Region';
      const regEntry = regionMap.get(regKey) || { name: regKey, count: 0, value: 0 };
      regEntry.count += 1;
      regEntry.value += price;
      regionMap.set(regKey, regEntry);
    }

    const byCategory = Array.from(catMap.values()).sort((a, b) => b.count - a.count);
    const byStation = Array.from(stationMap.values()).sort((a, b) => b.count - a.count).slice(0, 10);
    const byRegion = Array.from(regionMap.values()).sort((a, b) => b.count - a.count);
    const byStatus = [
      { name: 'Active', count: activeCount },
      { name: 'Under Maintenance', count: maintenanceCount },
      { name: 'Damaged', count: damagedCount },
      { name: 'Obsolete', count: obsoleteCount },
      { name: 'Auctioned', count: auctionedCount },
    ].filter((s) => s.count > 0);

    const totalAssets = data.length;
    const activeRate = totalAssets > 0 ? Math.round((activeCount / totalAssets) * 100) : 0;

    return NextResponse.json({
      data,
      summary: {
        totalAssets,
        totalValue,
        activeCount,
        maintenanceCount,
        damagedCount,
        missingCount,
        obsoleteCount,
        auctionedCount,
        assignedCount,
        unassignedCount: totalAssets - assignedCount,
        activeRate,
        topCategory: byCategory[0]?.name || 'N/A',
        topStation: byStation[0]?.name || 'N/A',
      },
      charts: {
        byCategory,
        byStatus,
        byStation,
        byRegion,
      },
    });
  } catch (err: any) {
    console.error('Inventory report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
