import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, regions, stations, departments } from '@/db/schema';
import { eq, or, isNull, lte, and, ne } from 'drizzle-orm';
import { verifyAuth, getScopeWhere, unauthorizedResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const conditions = [
      ne(assets.status, 'Disposed'),
      or(
        isNull(assets.lastVerificationDate),
        lte(assets.lastVerificationDate, ninetyDaysAgo)
      )
    ];

    // Apply role-based visibility scoping
    const scope = getScopeWhere(caller);
    if (scope.regionId) conditions.push(eq(assets.regionId, scope.regionId));
    if (scope.stationId) conditions.push(eq(assets.stationId, scope.stationId));

    const overdueAssets = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        brand: assets.brand,
        model: assets.model,
        serialNumber: assets.serialNumber,
        status: assets.status,
        lastVerificationDate: assets.lastVerificationDate,
        regionName: regions.name,
        stationName: stations.name,
        departmentName: departments.name,
      })
      .from(assets)
      .leftJoin(regions, eq(assets.regionId, regions.id))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(departments, eq(assets.departmentId, departments.id))
      .where(and(...conditions));

    // Calculate days overdue
    const result = overdueAssets.map((asset) => {
      let daysOverdue = 90; // Default if never verified
      if (asset.lastVerificationDate) {
        const diffTime = Math.abs(new Date().getTime() - new Date(asset.lastVerificationDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysOverdue = Math.max(0, diffDays - 90);
      }
      return {
        ...asset,
        daysOverdue,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Fetch due verifications error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
