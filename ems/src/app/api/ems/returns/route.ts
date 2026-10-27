import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '@/db';
import * as s from '@/db/schema';
import { emsAuth, serverError, notifyUsers, findUsersByRoleAtStation } from '@/lib/ems-server';
import { logAudit } from '@/lib/audit-helper';
import { returnDeadline, monthLabel, formatGHS } from '@/lib/ems-constants';

const r = s.emsMonthlyReturns;

export async function GET(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canViewReturns);
    if (a instanceof NextResponse) return a;

    const sp = new URL(req.url).searchParams;
    const year = sp.get('year') ? parseInt(sp.get('year')!) : undefined;

    const conditions: any[] = [];
    if (a.stationScope !== null) {
      conditions.push(eq(r.stationId, a.stationScope));
    }
    if (year) {
      conditions.push(eq(r.year, year));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const submitter = alias(s.users, 'submitter');
    const approver = alias(s.users, 'approver');

    const rows = await db
      .select({
        id: r.id,
        stationId: r.stationId,
        stationName: s.stations.name,
        regionId: r.regionId,
        regionName: s.regions.name,
        year: r.year,
        month: r.month,
        totalLetters: r.totalLetters,
        totalCost: r.totalCost,
        status: r.status,
        isLate: r.isLate,
        submittedAt: r.submittedAt,
        submittedByName: submitter.name,
        approvedAt: r.approvedAt,
        approvedByName: approver.name,
        unlockReason: r.unlockReason,
        createdAt: r.createdAt,
      })
      .from(r)
      .innerJoin(s.stations, eq(r.stationId, s.stations.id))
      .innerJoin(s.regions, eq(r.regionId, s.regions.id))
      .leftJoin(submitter, eq(r.submittedByUserId, submitter.id))
      .leftJoin(approver, eq(r.approvedByUserId, approver.id))
      .where(where)
      .orderBy(desc(r.year), desc(r.month), desc(r.id));

    return NextResponse.json({ success: true, returns: rows });
  } catch (err: any) {
    return serverError(err, 'get monthly returns');
  }
}

export async function POST(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canSubmitReturn, 'Only Admin Officers can submit monthly returns');
    if (a instanceof NextResponse) return a;

    const stationId = a.stationScope;
    if (!stationId) {
      return NextResponse.json({ message: 'No station is assigned to your account' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const year = parseInt(body.year || now.getFullYear().toString());
    const month = parseInt(body.month || (now.getMonth() + 1).toString());

    if (month < 1 || month > 12) {
      return NextResponse.json({ message: 'Month must be between 1 and 12' }, { status: 400 });
    }

    // Check if station has region
    const [station] = await db
      .select({ id: s.stations.id, regionId: s.stations.regionId, name: s.stations.name })
      .from(s.stations)
      .where(eq(s.stations.id, stationId))
      .limit(1);

    if (!station) {
      return NextResponse.json({ message: 'Assigned station not found' }, { status: 404 });
    }

    // Auto-calculate all verified entries for this station and month
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month, 1, 0, 0, 0);

    const [agg] = await db
      .select({
        count: sql<number>`count(*)`,
        totalCost: sql<string>`coalesce(sum(${s.emsDispatches.cost}), 0)`,
      })
      .from(s.emsDispatches)
      .where(
        and(
          eq(s.emsDispatches.stationId, stationId),
          eq(s.emsDispatches.status, 'Verified'),
          sql`${s.emsDispatches.dispatchDate} >= ${startOfMonth}`,
          sql`${s.emsDispatches.dispatchDate} < ${endOfMonth}`
        )
      );

    const totalLetters = Number(agg?.count || 0);
    const totalCost = (agg?.totalCost || '0.00').toString();
    const deadline = returnDeadline(year, month);
    const isLate = now.getTime() > deadline.getTime();

    // Check if a return already exists
    const [existing] = await db
      .select({ id: r.id, status: r.status })
      .from(r)
      .where(and(eq(r.stationId, stationId), eq(r.year, year), eq(r.month, month)))
      .limit(1);

    let returnId = existing?.id;

    if (existing) {
      if (existing.status === 'Submitted' || existing.status === 'Approved') {
        return NextResponse.json(
          { message: `Return for ${monthLabel(year, month)} has already been ${existing.status.toLowerCase()}.` },
          { status: 409 }
        );
      }

      await db
        .update(r)
        .set({
          totalLetters,
          totalCost,
          status: 'Submitted',
          isLate,
          submittedByUserId: a.user.sub,
          submittedAt: now,
          unlockReason: null,
        })
        .where(eq(r.id, existing.id));
    } else {
      const [inserted] = await db.insert(r).values({
        stationId,
        regionId: station.regionId,
        year,
        month,
        totalLetters,
        totalCost,
        status: 'Submitted',
        isLate,
        submittedByUserId: a.user.sub,
        submittedAt: now,
      });
      returnId = inserted.insertId;
    }

    await logAudit(
      'EMS Return Submitted',
      a.user.sub,
      req,
      `Submitted return for ${station.name} (${monthLabel(year, month)}): ${totalLetters} letters, ${formatGHS(totalCost)}`
    );

    // Notify HQ Directors
    const directors = await findUsersByRoleAtStation(null, ['EMS_Director', 'Super_Admin']);
    await notifyUsers(
      directors,
      'ReturnSubmitted',
      `${station.name} submitted their EMS return for ${monthLabel(year, month)} (${totalLetters} letters, ${formatGHS(totalCost)}). Ready for review.`,
      { returnId }
    );

    return NextResponse.json({
      success: true,
      message: `Monthly return for ${monthLabel(year, month)} submitted to HQ successfully!`,
      totalLetters,
      totalCost,
      status: 'Submitted',
    });
  } catch (err: any) {
    return serverError(err, 'submit monthly return');
  }
}
