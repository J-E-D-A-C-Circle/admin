import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, assetCategories, regions, stations, employees } from '@/db/schema';
import { eq, and, ne, or, isNull, lte } from 'drizzle-orm';
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

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const conditions = [
      ne(assets.status, 'Obsolete'),
      ne(assets.status, 'Auctioned'),
      or(isNull(assets.lastVerificationDate), lte(assets.lastVerificationDate, ninetyDaysAgo)),
    ];

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
        regionName: regions.name,
        stationName: stations.name,
        employeeName: employees.name,
        status: assets.status,
        lastVerificationDate: assets.lastVerificationDate,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(regions, eq(assets.regionId, regions.id))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(employees, eq(assets.assignedEmployeeId, employees.id))
      .where(and(...conditions))
      .orderBy(assets.lastVerificationDate);

    const nowMs = Date.now();
    let neverVerifiedCount = 0;

    const data = rows.map((r) => {
      if (!r.lastVerificationDate) neverVerifiedCount++;
      const daysOverdue = r.lastVerificationDate
        ? `${Math.floor((nowMs - new Date(r.lastVerificationDate).getTime()) / (1000 * 60 * 60 * 24))} days`
        : 'Never Verified';

      return {
        assetId: r.assetId,
        name: r.name,
        categoryName: r.categoryName || 'N/A',
        stationName: r.stationName || 'N/A',
        custodian: r.employeeName || 'Unassigned',
        status: r.status.replace('_', ' '),
        lastVerified: r.lastVerificationDate
          ? new Date(r.lastVerificationDate).toISOString().split('T')[0]
          : 'Never',
        daysSinceVerification: daysOverdue,
      };
    });

    return NextResponse.json({
      data,
      summary: {
        overdueAssets: data.length,
        neverVerified: neverVerifiedCount,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fetch overdue report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
