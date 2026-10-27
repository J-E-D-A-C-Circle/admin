import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gte, lt, like, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '@/db';
import * as s from '@/db/schema';
import { logAudit } from '@/lib/audit-helper';
import {
  emsAuth,
  serverError,
  isDuplicateOn,
  isPeriodLocked,
  referencePrefix,
  nextReferenceSeq,
  formatReferenceId,
  findUsersByRoleAtStation,
  notifyUsers,
  toMoneyString,
} from '@/lib/ems-server';
import { validateDispatchInput } from '@/lib/ems-dispatch-input';
import { EMS_PURPOSES, monthLabel, formatGHS } from '@/lib/ems-constants';

const d = s.emsDispatches;

export async function GET(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canViewDispatches);
    if (a instanceof NextResponse) return a;

    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, parseInt(sp.get('page') || '1'));
    const limit = Math.min(500, Math.max(1, parseInt(sp.get('limit') || '20')));
    const status = sp.get('status');
    const purpose = sp.get('purpose');
    const search = (sp.get('search') || '').trim();
    const from = sp.get('from');
    const to = sp.get('to');

    const conditions: SQL[] = [];

    // Office-scoped roles can only ever see their own office
    if (a.stationScope !== null) {
      conditions.push(eq(d.stationId, a.stationScope));
    } else {
      const stationId = parseInt(sp.get('stationId') || '');
      const regionId = parseInt(sp.get('regionId') || '');
      if (stationId) conditions.push(eq(d.stationId, stationId));
      if (regionId) conditions.push(eq(d.regionId, regionId));
    }

    if (status === 'Pending' || status === 'Verified' || status === 'Rejected') conditions.push(eq(d.status, status));
    if (purpose && (EMS_PURPOSES as readonly string[]).includes(purpose)) conditions.push(eq(d.purpose, purpose as any));
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) conditions.push(gte(d.dispatchDate, new Date(`${from}T00:00:00`)));
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      const end = new Date(`${to}T00:00:00`);
      end.setDate(end.getDate() + 1);
      conditions.push(lt(d.dispatchDate, end));
    }
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(d.recipientName, term),
          like(d.institution, term),
          like(d.destination, term),
          like(d.emsTrackingNumber, term),
          like(d.referenceId, term),
          like(d.referenceNo, term)
        )!
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const creator = alias(s.users, 'creator');

    const [rows, aggRows] = await Promise.all([
      db
        .select({
          id: d.id,
          referenceId: d.referenceId,
          dispatchDate: d.dispatchDate,
          regionId: d.regionId,
          regionName: s.regions.name,
          stationId: d.stationId,
          stationName: s.stations.name,
          recipientName: d.recipientName,
          institution: d.institution,
          destination: d.destination,
          emsTrackingNumber: d.emsTrackingNumber,
          purpose: d.purpose,
          referenceNo: d.referenceNo,
          cost: d.cost,
          hasReceipt: sql<number>`(${d.receiptFile} IS NOT NULL)`,
          status: d.status,
          rejectionReason: d.rejectionReason,
          createdByName: creator.name,
          createdAt: d.createdAt,
        })
        .from(d)
        .innerJoin(s.stations, eq(d.stationId, s.stations.id))
        .innerJoin(s.regions, eq(d.regionId, s.regions.id))
        .innerJoin(creator, eq(d.createdByUserId, creator.id))
        .where(where)
        .orderBy(desc(d.dispatchDate), desc(d.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({
          total: sql<number>`COUNT(*)`,
          cost: sql<string>`COALESCE(SUM(${d.cost}), 0)`,
        })
        .from(d)
        .where(where),
    ]);

    return NextResponse.json({
      data: rows.map((r) => ({ ...r, hasReceipt: !!Number(r.hasReceipt) })),
      total: Number(aggRows[0]?.total ?? 0),
      totalCost: Number(aggRows[0]?.cost ?? 0),
      page,
      limit,
    });
  } catch (err) {
    return serverError(err, 'list dispatches');
  }
}

export async function POST(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canCreateDispatch, 'Only Admin Officers can add dispatch records');
    if (a instanceof NextResponse) return a;

    const body = await req.json().catch(() => null);
    const v = validateDispatchInput(body);
    if (!v.ok) {
      const err = v as { ok: false; message: string; errors?: unknown };
      return NextResponse.json({ message: err.message, errors: err.errors }, { status: 400 });
    }
    const { data, date } = v;

    const stationId = a.stationScope!;
    const [office] = await db
      .select({ regionId: s.stations.regionId, name: s.stations.name })
      .from(s.stations)
      .where(eq(s.stations.id, stationId))
      .limit(1);
    if (!office) return NextResponse.json({ message: 'Your assigned office could not be found' }, { status: 400 });

    if (await isPeriodLocked(stationId, date)) {
      return NextResponse.json(
        { message: `The monthly return for ${monthLabel(date.getFullYear(), date.getMonth() + 1)} has already been submitted. Ask HQ to unlock it to add records for that month.` },
        { status: 423 }
      );
    }

    const [dup] = await db
      .select({ referenceId: d.referenceId })
      .from(d)
      .where(eq(d.emsTrackingNumber, data.emsTrackingNumber))
      .limit(1);
    if (dup) {
      return NextResponse.json(
        { message: `EMS tracking number ${data.emsTrackingNumber} has already been recorded (${dup.referenceId}). Duplicates are not allowed.` },
        { status: 409 }
      );
    }

    const prefix = await referencePrefix(stationId, date);
    let seq = await nextReferenceSeq(prefix);
    let created: { id: number; referenceId: string } | null = null;

    for (let attempt = 0; attempt < 8 && !created; attempt++) {
      const referenceId = formatReferenceId(prefix, seq);
      try {
        const [ins] = await db.insert(d).values({
          referenceId,
          dispatchDate: date,
          regionId: office.regionId,
          stationId,
          recipientName: data.recipientName,
          institution: data.institution,
          destination: data.destination,
          emsTrackingNumber: data.emsTrackingNumber,
          purpose: data.purpose,
          referenceNo: data.referenceNo,
          cost: toMoneyString(data.cost),
          receiptFile: data.receipt?.file ?? null,
          receiptOriginalName: data.receipt?.originalName ?? null,
          receiptMime: data.receipt?.mime ?? null,
          status: 'Pending',
          createdByUserId: a.user.sub,
        });
        created = { id: ins.insertId, referenceId };
      } catch (err: any) {
        if (isDuplicateOn(err, 'ems_tracking_number')) {
          return NextResponse.json({ message: `EMS tracking number ${data.emsTrackingNumber} has already been recorded. Duplicates are not allowed.` }, { status: 409 });
        }
        if (isDuplicateOn(err, 'reference_id')) {
          seq += 1; // another request took this sequence number, try the next one
          continue;
        }
        throw err;
      }
    }
    if (!created) return NextResponse.json({ message: 'Could not generate a unique reference ID, please try again' }, { status: 503 });

    await logAudit('EMS Dispatch Added', a.user.sub, req, `${created.referenceId} (${data.emsTrackingNumber}, ${formatGHS(data.cost)})`);

    const managers = await findUsersByRoleAtStation(stationId, ['EMS_Manager']);
    await notifyUsers(
      managers,
      'NewEntryToVerify',
      `New EMS entry ${created.referenceId} (${formatGHS(data.cost)} to ${data.recipientName}, ${data.destination}) from ${office.name} is waiting for your verification.`,
      { dispatchId: created.id }
    );

    return NextResponse.json({ ...created, status: 'Pending' }, { status: 201 });
  } catch (err) {
    return serverError(err, 'create dispatch');
  }
}
