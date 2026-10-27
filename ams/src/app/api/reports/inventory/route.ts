import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, assetCategories, assetSubcategories, regions, stations, departments, employees } from '@/db/schema';
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

    const conditions = [];
    if (regionId) conditions.push(eq(assets.regionId, parseInt(regionId)));
    if (stationId) conditions.push(eq(assets.stationId, parseInt(stationId)));
    if (categoryId) conditions.push(eq(assets.categoryId, parseInt(categoryId)));
    if (startDate) conditions.push(sql`${assets.acquisitionDate} >= ${startDate}`);
    if (endDate) conditions.push(sql`${assets.acquisitionDate} <= ${endDate}`);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        brand: assets.brand,
        model: assets.model,
        serialNumber: assets.serialNumber,
        status: assets.status,
        acquisitionDate: assets.acquisitionDate,
        lastVerificationDate: assets.lastVerificationDate,
        description: assets.description,
        categoryName: assetCategories.name,
        subcategoryName: assetSubcategories.name,
        regionName: regions.name,
        stationName: stations.name,
        departmentName: departments.name,
        assignedEmployeeName: employees.name,
        assignedEmployeeIdCode: employees.employeeId,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(assetSubcategories, eq(assets.subcategoryId, assetSubcategories.id))
      .leftJoin(regions, eq(assets.regionId, regions.id))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(departments, eq(assets.departmentId, departments.id))
      .leftJoin(employees, eq(assets.assignedEmployeeId, employees.id))
      .where(whereClause)
      .orderBy(assets.assetId);

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Fetch inventory report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
