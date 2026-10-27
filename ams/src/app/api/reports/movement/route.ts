import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, assetTransfers, regions, stations, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';

const fromRegion = alias(regions, 'from_region');
const toRegion = alias(regions, 'to_region');
const fromStation = alias(stations, 'from_station');
const toStation = alias(stations, 'to_station');
const transferUser = alias(users, 'transfer_user');

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
    if (regionId) {
      conditions.push(
        and(
          eq(assetTransfers.toRegionId, parseInt(regionId))
        )
      );
    }
    if (stationId) {
      conditions.push(
        and(
          eq(assetTransfers.toStationId, parseInt(stationId))
        )
      );
    }
    if (categoryId) conditions.push(eq(assets.categoryId, parseInt(categoryId)));
    if (startDate) conditions.push(sql`${assetTransfers.transferDate} >= ${startDate}`);
    if (endDate) conditions.push(sql`${assetTransfers.transferDate} <= ${endDate}`);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const transfers = await db
      .select({
        assetId: assetTransfers.assetId,
        name: assets.name,
        fromRegionName: fromRegion.name,
        fromStationName: fromStation.name,
        toRegionName: toRegion.name,
        toStationName: toStation.name,
        transferDate: assetTransfers.transferDate,
        transferredBy: transferUser.name,
        reason: assetTransfers.reason,
      })
      .from(assetTransfers)
      .leftJoin(assets, eq(assetTransfers.assetId, assets.assetId))
      .leftJoin(transferUser, eq(assetTransfers.transferredByUserId, transferUser.id))
      .leftJoin(fromRegion, eq(assetTransfers.fromRegionId, fromRegion.id))
      .leftJoin(toRegion, eq(assetTransfers.toRegionId, toRegion.id))
      .leftJoin(fromStation, eq(assetTransfers.fromStationId, fromStation.id))
      .leftJoin(toStation, eq(assetTransfers.toStationId, toStation.id))
      .where(whereClause)
      .orderBy(sql`${assetTransfers.transferDate} DESC`);

    // Format the result to return location details
    const formatted = transfers.map(t => ({
      assetId: t.assetId,
      name: t.name,
      fromLocation: `${t.fromStationName || 'Unknown'}, ${t.fromRegionName || 'Unknown'}`,
      toLocation: `${t.toStationName || 'Unknown'}, ${t.toRegionName || 'Unknown'}`,
      transferDate: t.transferDate,
      transferredBy: t.transferredBy,
      reason: t.reason,
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Fetch movement report error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
