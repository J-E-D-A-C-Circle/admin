import { NextRequest, NextResponse } from 'next/server';
import { eq, sql, desc, and } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import { emsAuth, serverError } from '@/lib/ems-server';

export async function GET(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canViewReports || p.canViewDispatches);
    if (a instanceof NextResponse) return a;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all stations with region
    const stationRows = await db
      .select({
        id: s.stations.id,
        name: s.stations.name,
        code: s.stations.code,
        location: s.stations.location,
        regionId: s.stations.regionId,
        regionName: s.regions.name,
        regionCode: s.regions.code,
      })
      .from(s.stations)
      .innerJoin(s.regions, eq(s.stations.regionId, s.regions.id))
      .orderBy(s.regions.name, s.stations.name);

    // Get returns for current month
    const returnRows = await db
      .select({
        stationId: s.emsMonthlyReturns.stationId,
        status: s.emsMonthlyReturns.status,
        submittedAt: s.emsMonthlyReturns.submittedAt,
        totalLetters: s.emsMonthlyReturns.totalLetters,
        totalCost: s.emsMonthlyReturns.totalCost,
      })
      .from(s.emsMonthlyReturns)
      .where(
        and(
          eq(s.emsMonthlyReturns.year, currentYear),
          eq(s.emsMonthlyReturns.month, currentMonth)
        )
      );
    const returnMap = new Map(returnRows.map((r) => [r.stationId, r]));

    // Get month dispatch aggregation per station
    const dispatchAgg = await db
      .select({
        stationId: s.emsDispatches.stationId,
        count: sql<number>`count(*)`,
        totalCost: sql<string>`coalesce(sum(${s.emsDispatches.cost}), 0)`,
        lastDate: sql<string>`max(${s.emsDispatches.dispatchDate})`,
      })
      .from(s.emsDispatches)
      .where(
        and(
          sql`${s.emsDispatches.dispatchDate} >= ${startOfMonth}`,
          sql`${s.emsDispatches.dispatchDate} < ${endOfMonth}`
        )
      )
      .groupBy(s.emsDispatches.stationId);
    const dispatchMap = new Map(dispatchAgg.map((d) => [d.stationId, d]));

    // Calculate compliance status per SRS Section 4.1 & 4.5
    // Green = Submitted
    // Yellow = Pending (Deadline 5th)
    // Red = Not Submitted / Overdue / Inactive > 7 days
    const isPastDeadline = now.getDate() > 5;

    const offices = stationRows.map((st) => {
      const ret = returnMap.get(st.id);
      const disp = dispatchMap.get(st.id);
      const lastDate = disp?.lastDate ? new Date(disp.lastDate) : null;
      const isInactive7Days = !lastDate || lastDate < sevenDaysAgo;

      let compliance: 'Green' | 'Yellow' | 'Red';
      let statusLabel = 'Pending Submission';

      if (ret && (ret.status === 'Submitted' || ret.status === 'Approved')) {
        compliance = 'Green';
        statusLabel = ret.status === 'Approved' ? 'Approved by HQ' : 'Submitted & Compliant';
      } else if (isPastDeadline || isInactive7Days) {
        compliance = 'Red';
        statusLabel = isPastDeadline ? 'Overdue Return (>5th)' : 'Inactive (>7 Days)';
      } else {
        compliance = 'Yellow';
        statusLabel = 'Pending Submission (Due 5th)';
      }

      return {
        id: st.id,
        name: st.name,
        code: st.code,
        location: st.location || 'Official Office',
        regionId: st.regionId,
        regionName: st.regionName,
        regionCode: st.regionCode,
        compliance,
        statusLabel,
        lettersThisMonth: Number(disp?.count || 0),
        costThisMonth: parseFloat(disp?.totalCost || '0'),
        lastDispatchDate: disp?.lastDate || null,
        returnStatus: ret?.status || 'Not Submitted',
      };
    });

    return NextResponse.json({
      success: true,
      data: offices,
      summary: {
        totalOffices: offices.length,
        greenCount: offices.filter((o) => o.compliance === 'Green').length,
        yellowCount: offices.filter((o) => o.compliance === 'Yellow').length,
        redCount: offices.filter((o) => o.compliance === 'Red').length,
        isPastDeadline,
      },
    });
  } catch (err: any) {
    return serverError(err, 'get ems offices compliance');
  }
}
