import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import { emsAuth, serverError } from '@/lib/ems-server';
import { monthLabel, EMS_PURPOSES } from '@/lib/ems-constants';

const d = s.emsDispatches;

export async function GET(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canViewReports || p.canViewDispatches);
    if (a instanceof NextResponse) return a;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 1);

    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const scopeCond = a.stationScope !== null ? eq(d.stationId, a.stationScope) : undefined;

    // Month Stats
    const [monthStats] = await db
      .select({
        totalLetters: sql<number>`count(*)`,
        totalCost: sql<string>`coalesce(sum(${d.cost}), 0)`,
        verifiedCount: sql<number>`sum(case when ${d.status} = 'Verified' then 1 else 0 end)`,
        pendingCount: sql<number>`sum(case when ${d.status} = 'Pending' then 1 else 0 end)`,
        rejectedCount: sql<number>`sum(case when ${d.status} = 'Rejected' then 1 else 0 end)`,
      })
      .from(d)
      .where(
        scopeCond
          ? and(scopeCond, sql`${d.dispatchDate} >= ${startOfMonth}`, sql`${d.dispatchDate} < ${endOfMonth}`)
          : and(sql`${d.dispatchDate} >= ${startOfMonth}`, sql`${d.dispatchDate} < ${endOfMonth}`)
      );

    // Year Stats
    const [yearStats] = await db
      .select({
        totalLetters: sql<number>`count(*)`,
        totalCost: sql<string>`coalesce(sum(${d.cost}), 0)`,
      })
      .from(d)
      .where(
        scopeCond
          ? and(scopeCond, sql`${d.dispatchDate} >= ${startOfYear}`, sql`${d.dispatchDate} < ${endOfYear}`)
          : and(sql`${d.dispatchDate} >= ${startOfYear}`, sql`${d.dispatchDate} < ${endOfYear}`)
      );

    const monthLetters = Number(monthStats?.totalLetters || 0);
    const monthCost = parseFloat(monthStats?.totalCost || '0');
    const yearLetters = Number(yearStats?.totalLetters || 0);
    const yearCost = parseFloat(yearStats?.totalCost || '0');

    const avgCostPerLetter = monthLetters > 0 ? (monthCost / monthLetters).toFixed(2) : '0.00';

    // Purpose breakdown
    const purposeRows = await db
      .select({
        purpose: d.purpose,
        count: sql<number>`count(*)`,
        totalCost: sql<string>`coalesce(sum(${d.cost}), 0)`,
      })
      .from(d)
      .where(
        scopeCond
          ? and(scopeCond, sql`${d.dispatchDate} >= ${startOfYear}`, sql`${d.dispatchDate} < ${endOfYear}`)
          : and(sql`${d.dispatchDate} >= ${startOfYear}`, sql`${d.dispatchDate} < ${endOfYear}`)
      )
      .groupBy(d.purpose);

    // Top spending stations (for National/HQ or all offices)
    const stationRows = await db
      .select({
        stationId: d.stationId,
        stationName: s.stations.name,
        regionName: s.regions.name,
        letterCount: sql<number>`count(*)`,
        totalCost: sql<string>`coalesce(sum(${d.cost}), 0)`,
      })
      .from(d)
      .innerJoin(s.stations, eq(d.stationId, s.stations.id))
      .innerJoin(s.regions, eq(d.regionId, s.regions.id))
      .where(and(sql`${d.dispatchDate} >= ${startOfYear}`, sql`${d.dispatchDate} < ${endOfYear}`))
      .groupBy(d.stationId, s.stations.name, s.regions.name)
      .orderBy(desc(sql`coalesce(sum(${d.cost}), 0)`))
      .limit(10);

    // Alerts: stations that haven't dispatched in 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inactiveStations = await db
      .select({
        stationId: s.stations.id,
        stationName: s.stations.name,
        regionName: s.regions.name,
        lastDate: sql<string>`max(${d.dispatchDate})`,
      })
      .from(s.stations)
      .innerJoin(s.regions, eq(s.stations.regionId, s.regions.id))
      .leftJoin(d, eq(s.stations.id, d.stationId))
      .groupBy(s.stations.id, s.stations.name, s.regions.name)
      .having(sql`max(${d.dispatchDate}) < ${sevenDaysAgo} or max(${d.dispatchDate}) is null`)
      .limit(8);

    return NextResponse.json({
      success: true,
      currentPeriod: monthLabel(currentYear, currentMonth),
      month: {
        totalLetters: monthLetters,
        totalCost: monthCost,
        avgCostPerLetter,
        verifiedCount: Number(monthStats?.verifiedCount || 0),
        pendingCount: Number(monthStats?.pendingCount || 0),
        rejectedCount: Number(monthStats?.rejectedCount || 0),
      },
      year: {
        totalLetters: yearLetters,
        totalCost: yearCost,
      },
      purposeBreakdown: purposeRows.map((p) => ({
        purpose: p.purpose,
        count: Number(p.count),
        totalCost: parseFloat(p.totalCost),
      })),
      topOffices: stationRows.map((st) => ({
        stationId: st.stationId,
        stationName: st.stationName,
        regionName: st.regionName,
        letterCount: Number(st.letterCount),
        totalCost: parseFloat(st.totalCost),
      })),
      inactiveStations: inactiveStations.map((ist) => ({
        stationId: ist.stationId,
        stationName: ist.stationName,
        regionName: ist.regionName,
        lastDispatch: ist.lastDate,
      })),
    });
  } catch (err: any) {
    return serverError(err, 'get ems stats');
  }
}
