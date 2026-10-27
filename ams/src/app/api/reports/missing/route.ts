import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, stations, departments, employees } from '@/db/schema';
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

    const conditions = [eq(assets.status, 'Missing')];
    if (regionId) conditions.push(eq(assets.regionId, parseInt(regionId)));
    if (stationId) conditions.push(eq(assets.stationId, parseInt(stationId)));
    if (categoryId) conditions.push(eq(assets.categoryId, parseInt(categoryId)));
    if (startDate) conditions.push(sql`${assets.lastVerificationDate} >= ${startDate}`);
    if (endDate) conditions.push(sql`${assets.lastVerificationDate} <= ${endDate}`);

    const whereClause = and(...conditions);

    const missingAssets = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        stationName: stations.name,
        departmentName: departments.name,
        employeeName: employees.name,
        lastSeenDate: assets.lastVerificationDate,
      })
      .from(assets)
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(departments, eq(assets.departmentId, departments.id))
      .leftJoin(employees, eq(assets.assignedEmployeeId, employees.id))
      .where(whereClause)
      .orderBy(assets.assetId);

    const formatted = missingAssets.map(a => ({
      assetId: a.assetId,
      name: a.name,
      station: a.stationName,
      department: a.departmentName,
      employee: a.employeeName || null,
      lastSeenDate: a.lastSeenDate,
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Fetch missing report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
