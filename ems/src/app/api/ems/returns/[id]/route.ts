import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import { emsAuth, serverError, notifyUsers, findUsersByRoleAtStation } from '@/lib/ems-server';
import { logAudit } from '@/lib/audit-helper';
import { monthLabel } from '@/lib/ems-constants';

const r = s.emsMonthlyReturns;

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const a = emsAuth(req, (p) => p.canApproveReturn || p.canManageUsers, 'Only Director Administration HQ or Super Admin can approve or unlock monthly returns');
    if (a instanceof NextResponse) return a;

    const { id } = await params;
    const returnId = parseInt(id);

    const [ret] = await db
      .select({
        id: r.id,
        stationId: r.stationId,
        year: r.year,
        month: r.month,
        status: r.status,
        submittedByUserId: r.submittedByUserId,
      })
      .from(r)
      .where(eq(r.id, returnId))
      .limit(1);

    if (!ret) {
      return NextResponse.json({ message: 'Monthly return record not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || (body.status === 'Unlocked' ? 'unlock' : 'approve');
    const now = new Date();

    if (action === 'unlock') {
      const isSuperAdmin = a.user.role === 'Super Admin' || a.user.role === 'Super_Admin';
      if (!isSuperAdmin) {
        return NextResponse.json(
          { message: 'Access Denied. Only the Super Administrator has authority to unlock a finalized return.' },
          { status: 403 }
        );
      }
      const unlockReason = (body.unlockReason || body.reason || '').trim();
      if (!unlockReason) {
        return NextResponse.json({ message: 'A reason is mandatory when unlocking a return for correction.' }, { status: 400 });
      }

      await db
        .update(r)
        .set({
          status: 'Unlocked',
          unlockReason,
          unlockedByUserId: a.user.sub,
          unlockedAt: now,
        })
        .where(eq(r.id, returnId));

      await logAudit(
        'EMS Return Unlocked',
        a.user.sub,
        req,
        `Unlocked return #${returnId} (${monthLabel(ret.year, ret.month)}): ${unlockReason}`
      );

      // Notify the station officer
      const officers = await findUsersByRoleAtStation(ret.stationId, ['EMS_Admin_Officer']);
      await notifyUsers(
        officers,
        'ReturnUnlocked',
        `HQ unlocked the ${monthLabel(ret.year, ret.month)} monthly return for correction: "${unlockReason}". You can now edit entries and re-submit.`,
        { returnId }
      );

      return NextResponse.json({
        success: true,
        message: `Return for ${monthLabel(ret.year, ret.month)} has been unlocked for correction.`,
        status: 'Unlocked',
      });
    } else {
      // Approve
      await db
        .update(r)
        .set({
          status: 'Approved',
          approvedByUserId: a.user.sub,
          approvedAt: now,
          unlockReason: null,
        })
        .where(eq(r.id, returnId));

      await logAudit(
        'EMS Return Approved',
        a.user.sub,
        req,
        `Approved return #${returnId} (${monthLabel(ret.year, ret.month)})`
      );

      // Notify the station officer
      const officers = await findUsersByRoleAtStation(ret.stationId, ['EMS_Admin_Officer', 'EMS_Manager']);
      await notifyUsers(
        officers,
        'ReturnApproved',
        `HQ approved the ${monthLabel(ret.year, ret.month)} monthly return.`,
        { returnId }
      );

      return NextResponse.json({
        success: true,
        message: `Return for ${monthLabel(ret.year, ret.month)} approved by HQ.`,
        status: 'Approved',
      });
    }
  } catch (err: any) {
    return serverError(err, 'approve or unlock monthly return');
  }
}
