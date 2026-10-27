import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, stations, departments, regions, assetCategories } from '@/db/schema';
import { eq, and, count as countFn, isNotNull, ne, or, isNull, lte } from 'drizzle-orm';
import { verifyAuth, getScopeWhere, unauthorizedResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const scope = getScopeWhere(caller);
    const conditions = [];
    if (scope.regionId) conditions.push(eq(assets.regionId, scope.regionId));
    if (scope.stationId) conditions.push(eq(assets.stationId, scope.stationId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Total counts
    const [totalRes] = await db.select({ value: countFn() }).from(assets).where(whereClause);
    const [activeRes] = await db.select({ value: countFn() }).from(assets).where(and(eq(assets.status, 'Active'), whereClause));
    const [missingRes] = await db.select({ value: countFn() }).from(assets).where(and(eq(assets.status, 'Missing'), whereClause));
    const [damagedRes] = await db.select({ value: countFn() }).from(assets).where(and(eq(assets.status, 'Damaged'), whereClause));
    const [maintenanceRes] = await db.select({ value: countFn() }).from(assets).where(and(eq(assets.status, 'Under_Maintenance'), whereClause));

    // Scheduled Verification Reminders KPI
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const [overdueVerificationsRes] = await db
      .select({ value: countFn() })
      .from(assets)
      .where(
        and(
          ne(assets.status, 'Disposed'),
          or(
            isNull(assets.lastVerificationDate),
            lte(assets.lastVerificationDate, ninetyDaysAgo)
          ),
          whereClause
        )
      );

    const [stationsCount] = await db.select({ value: countFn() }).from(stations);
    const [deptsCount] = await db.select({ value: countFn() }).from(departments);
    const [regionsCount] = await db.select({ value: countFn() }).from(regions);

    // 2. Fleet / Vehicle KPIs — assets with a license plate are vehicles
    const vehicleBaseConditions = [...conditions, isNotNull(assets.licensePlate)];
    const vehicleWhere = vehicleBaseConditions.length > 0 ? and(...vehicleBaseConditions) : undefined;

    const [totalVehiclesRes] = await db.select({ value: countFn() }).from(assets).where(vehicleWhere);
    const [vehiclesActiveRes] = await db
      .select({ value: countFn() })
      .from(assets)
      .where(and(eq(assets.status, 'Active'), vehicleWhere));
    const [vehiclesMaintenanceRes] = await db
      .select({ value: countFn() })
      .from(assets)
      .where(and(eq(assets.status, 'Under_Maintenance'), vehicleWhere));

    // 3. Assets By Region
    const regionGroups = await db
      .select({
        regionId: assets.regionId,
        count: countFn(),
      })
      .from(assets)
      .where(whereClause)
      .groupBy(assets.regionId);

    const regionsList = await db.select().from(regions);
    const assetsByRegion = regionGroups.map((rg) => ({
      name: regionsList.find((r) => r.id === rg.regionId)?.name || 'Unknown',
      value: rg.count,
    }));

    // 4. Assets By Category
    const categoryGroups = await db
      .select({
        categoryId: assets.categoryId,
        count: countFn(),
      })
      .from(assets)
      .where(whereClause)
      .groupBy(assets.categoryId);

    const categoriesList = await db.select().from(assetCategories);
    const assetsByCategory = categoryGroups.map((cg) => ({
      name: categoriesList.find((c) => c.id === cg.categoryId)?.name || 'Unknown',
      value: cg.count,
    }));

    // 5. Assets By Status
    const statusGroups = await db
      .select({
        status: assets.status,
        count: countFn(),
      })
      .from(assets)
      .where(whereClause)
      .groupBy(assets.status);

    const assetsByStatus = statusGroups.map((sg) => ({
      name: sg.status,
      value: sg.count,
    }));

    // 6. Assets By Age & Category buckets for Heatmap
    const allAssets = await db
      .select({
        acquisitionDate: assets.acquisitionDate,
        categoryName: assetCategories.name,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .where(and(ne(assets.status, 'Disposed'), whereClause));

    const categoriesSet = new Set(allAssets.map((a) => a.categoryName || 'Unknown'));
    const categories = Array.from(categoriesSet);

    const ageBuckets = ['0-1 Yr', '1-3 Yrs', '3-5 Yrs', '5+ Yrs'];
    const assetsByAge = ageBuckets.map((bucket) => {
      const entry: any = { name: bucket };
      categories.forEach((cat) => {
        entry[cat] = 0;
      });
      return entry;
    });

    const now = new Date().getTime();
    const msInYear = 1000 * 60 * 60 * 24 * 365.25;

    allAssets.forEach((asset) => {
      if (!asset.acquisitionDate) return;
      const ageYrs = (now - new Date(asset.acquisitionDate).getTime()) / msInYear;
      const cat = asset.categoryName || 'Unknown';
      let bucketIdx = 3; // '5+ Yrs'
      if (ageYrs <= 1) bucketIdx = 0;
      else if (ageYrs <= 3) bucketIdx = 1;
      else if (ageYrs <= 5) bucketIdx = 2;

      assetsByAge[bucketIdx][cat] = (assetsByAge[bucketIdx][cat] || 0) + 1;
    });

    return NextResponse.json({
      kpis: {
        total: totalRes?.value || 0,
        active: activeRes?.value || 0,
        missing: missingRes?.value || 0,
        damaged: damagedRes?.value || 0,
        underMaintenance: maintenanceRes?.value || 0,
        overdueVerifications: overdueVerificationsRes?.value || 0,
        stations: stationsCount?.value || 0,
        departments: deptsCount?.value || 0,
        regions: regionsCount?.value || 0,
        // Fleet KPIs
        totalVehicles: totalVehiclesRes?.value || 0,
        vehiclesActive: vehiclesActiveRes?.value || 0,
        vehiclesMaintenance: vehiclesMaintenanceRes?.value || 0,
      },
      charts: {
        assetsByRegion,
        assetsByCategory,
        assetsByStatus,
        assetsByAge,
        categoriesList: categories,
      },
    });
  } catch (err: any) {
    console.error('Fetch dashboard error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
