import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, assetCategories, regions, stations, departments, employees } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
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

    const conditions = [ne(assets.status, 'Obsolete'), ne(assets.status, 'Auctioned')];
    if (scope.regionId) conditions.push(eq(assets.regionId, scope.regionId));
    if (scope.stationId) conditions.push(eq(assets.stationId, scope.stationId));
    if (regionId && !scope.regionId) conditions.push(eq(assets.regionId, parseInt(regionId, 10)));
    if (stationId && !scope.stationId) conditions.push(eq(assets.stationId, parseInt(stationId, 10)));
    if (categoryId) conditions.push(eq(assets.categoryId, parseInt(categoryId, 10)));

    const rows = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        categoryName: assetCategories.name,
        status: assets.status,
        regionName: regions.name,
        stationName: stations.name,
        departmentName: departments.name,
        subLocation: assets.subLocation,
        custodianName: employees.name,
        employeeIdCode: employees.employeeId,
        purchaseValue: assets.purchaseValue,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(regions, eq(assets.regionId, regions.id))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(departments, eq(assets.departmentId, departments.id))
      .leftJoin(employees, eq(assets.assignedEmployeeId, employees.id))
      .where(and(...conditions))
      .orderBy(employees.name, assets.assetId);

    let assignedCount = 0;
    let unassignedCount = 0;

    const data = rows.map((r) => {
      if (r.custodianName) assignedCount++;
      else unassignedCount++;

      return {
        custodian: r.custodianName || 'Unassigned',
        employeeId: r.employeeIdCode || '—',
        assetId: r.assetId,
        assetName: r.name,
        categoryName: r.categoryName || 'N/A',
        stationName: r.stationName || 'N/A',
        departmentName: r.departmentName || 'N/A',
        subLocation: r.subLocation || '—',
        status: r.status.replace('_', ' '),
        purchaseValue: r.purchaseValue ? `GHS ${Number(r.purchaseValue).toLocaleString()}` : 'Not Recorded',
      };
    });

    return NextResponse.json({
      data,
      summary: {
        totalAssets: data.length,
        assignedAssets: assignedCount,
        unassignedPool: unassignedCount,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fetch custodian report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
