import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { and, desc, eq, like, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '@/db';
import * as s from '@/db/schema';
import { logAudit } from '@/lib/audit-helper';
import {
  emsAuth,
  serverError,
  isDuplicateOn,
  isPeriodLocked,
  getPeriodReturn,
  getScopedDispatch,
  findUsersByRoleAtStation,
  notifyUsers,
  toMoneyString,
  type EmsAuth,
} from '@/lib/ems-server';
import { validateDispatchInput, RECEIPT_DIR } from '@/lib/ems-dispatch-input';
import { monthLabel, formatGHS, toDateInputValue } from '@/lib/ems-constants';

const d = s.emsDispatches;

type Ctx = { params: Promise<{ id: string }> };

async function computeFlags(row: typeof d.$inferSelect, a: EmsAuth) {
  const ret = await getPeriodReturn(row.stationId, row.dispatchDate);
  const locked = !!ret && (ret.status === 'Submitted' || ret.status === 'Approved');
  const unlocked = ret?.status === 'Unlocked';
  return {
    locked,
    periodReturnStatus: ret?.status ?? null,
    unlockReason: unlocked ? ret?.unlockReason ?? null : null,
    // Officers may edit Pending / Rejected entries. Verified entries only become editable once HQ unlocks the month.
    editable: a.perms.canEditDispatch && !locked && (row.status !== 'Verified' || unlocked),
    verifiable: a.perms.canVerify && row.status === 'Pending' && !locked,
  };
}

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const a = emsAuth(req, (p) => p.canViewDispatches);
    if (a instanceof NextResponse) return a;

    const { id } = await params;
    const row = await getScopedDispatch(parseInt(id), a.stationScope);
    if (!row) return NextResponse.json({ message: 'Dispatch record not found' }, { status: 404 });

    const creator = alias(s.users, 'creator');
    const verifier = alias(s.users, 'verifier');
    const [full] = await db
      .select({
        regionName: s.regions.name,
        stationName: s.stations.name,
        createdByName: creator.name,
        verifiedByName: verifier.name,
      })
      .from(d)
      .innerJoin(s.regions, eq(d.regionId, s.regions.id))
      .innerJoin(s.stations, eq(d.stationId, s.stations.id))
      .innerJoin(creator, eq(d.createdByUserId, creator.id))
      .leftJoin(verifier, eq(d.verifiedByUserId, verifier.id))
      .where(eq(d.id, row.id))
      .limit(1);

    const history = await db
      .select({ id: s.auditLogs.id, action: s.auditLogs.action, detail: s.auditLogs.affectedRecord, userName: s.users.name, createdAt: s.auditLogs.createdAt })
      .from(s.auditLogs)
      .leftJoin(s.users, eq(s.auditLogs.userId, s.users.id))
      .where(and(like(s.auditLogs.action, 'EMS Dispatch%'), like(s.auditLogs.affectedRecord, `${row.referenceId}%`)))
      .orderBy(desc(s.auditLogs.createdAt), desc(s.auditLogs.id))
      .limit(50);

    const flags = await computeFlags(row, a);
    const { receiptFile, ...rest } = row;

    return NextResponse.json({
      ...rest,
      ...full,
      hasReceipt: !!receiptFile,
      ...flags,
      history,
    });
  } catch (err) {
    return serverError(err, 'get dispatch');
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const a = emsAuth(req, (p) => p.canEditDispatch, 'Only Admin Officers can edit dispatch records');
    if (a instanceof NextResponse) return a;

    const { id } = await params;
    const row = await getScopedDispatch(parseInt(id), a.stationScope);
    if (!row) return NextResponse.json({ message: 'Dispatch record not found' }, { status: 404 });

    const flags = await computeFlags(row, a);
    if (flags.locked) {
      return NextResponse.json(
        { message: `The monthly return for ${monthLabel(row.dispatchDate.getFullYear(), row.dispatchDate.getMonth() + 1)} has been submitted, so this record is locked. Ask HQ to unlock it.` },
        { status: 423 }
      );
    }
    if (!flags.editable) {
      return NextResponse.json({ message: 'Verified records cannot be edited' }, { status: 409 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });

    // Omitted receipt => keep the existing one
    const existingReceipt = row.receiptFile
      ? { file: row.receiptFile, originalName: row.receiptOriginalName || 'receipt', mime: row.receiptMime }
      : null;
    const v = validateDispatchInput({ ...body, receipt: body.receipt === undefined ? existingReceipt : body.receipt });
    if (!v.ok) {
      const err = v as { ok: false; message: string; errors?: unknown };
      return NextResponse.json({ message: err.message, errors: err.errors }, { status: 400 });
    }
    const { data, date } = v;

    if (date.getMonth() !== row.dispatchDate.getMonth() || date.getFullYear() !== row.dispatchDate.getFullYear()) {
      if (await isPeriodLocked(row.stationId, date)) {
        return NextResponse.json({ message: 'The monthly return for the new date has already been submitted' }, { status: 423 });
      }
    }

    const [dup] = await db
      .select({ referenceId: d.referenceId })
      .from(d)
      .where(and(eq(d.emsTrackingNumber, data.emsTrackingNumber), ne(d.id, row.id)))
      .limit(1);
    if (dup) {
      return NextResponse.json(
        { message: `EMS tracking number ${data.emsTrackingNumber} has already been recorded (${dup.referenceId}). Duplicates are not allowed.` },
        { status: 409 }
      );
    }

    // Human-readable change summary for the audit trail (who changed which figure and when)
    const changes: string[] = [];
    const track = (label: string, before: unknown, after: unknown) => {
      if (String(before ?? '') !== String(after ?? '')) changes.push(`${label}: "${before ?? ''}" -> "${after ?? ''}"`);
    };
    track('date', toDateInputValue(row.dispatchDate), toDateInputValue(date));
    track('recipient', row.recipientName, data.recipientName);
    track('institution', row.institution, data.institution);
    track('destination', row.destination, data.destination);
    track('tracking no', row.emsTrackingNumber, data.emsTrackingNumber);
    track('purpose', row.purpose, data.purpose);
    track('reference no', row.referenceNo, data.referenceNo);
    track('cost', formatGHS(row.cost), formatGHS(data.cost));
    const receiptChanged = (data.receipt?.file ?? null) !== (row.receiptFile ?? null);
    if (receiptChanged) changes.push('receipt replaced');

    const resetsVerification = row.status !== 'Pending';

    try {
      await db
        .update(d)
        .set({
          dispatchDate: date,
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
          ...(resetsVerification
            ? { status: 'Pending' as const, rejectionReason: null, verifiedByUserId: null, verifiedAt: null }
            : {}),
        })
        .where(eq(d.id, row.id));
    } catch (err: any) {
      if (isDuplicateOn(err, 'ems_tracking_number')) {
        return NextResponse.json({ message: `EMS tracking number ${data.emsTrackingNumber} has already been recorded. Duplicates are not allowed.` }, { status: 409 });
      }
      throw err;
    }

    if (receiptChanged && row.receiptFile) {
      try { fs.unlinkSync(path.join(RECEIPT_DIR, row.receiptFile)); } catch { /* old file already gone */ }
    }

    const summary = changes.length ? changes.join('; ') : 'no field changes';
    await logAudit('EMS Dispatch Edited', a.user.sub, req, `${row.referenceId} (${summary})`.slice(0, 255));

    if (resetsVerification) {
      const managers = await findUsersByRoleAtStation(row.stationId, ['EMS_Manager']);
      await notifyUsers(
        managers,
        'NewEntryToVerify',
        `EMS entry ${row.referenceId} was corrected and resubmitted (${formatGHS(data.cost)} to ${data.recipientName}). Please verify it again.`,
        { dispatchId: row.id }
      );
    }

    return NextResponse.json({ id: row.id, referenceId: row.referenceId, status: 'Pending' });
  } catch (err) {
    return serverError(err, 'update dispatch');
  }
}
