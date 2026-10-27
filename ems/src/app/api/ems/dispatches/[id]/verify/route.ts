import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import { emsAuth, serverError, getScopedDispatch, notifyUsers } from '@/lib/ems-server';
import { logAudit } from '@/lib/audit-helper';
import { formatGHS } from '@/lib/ems-constants';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const a = emsAuth(req, (p) => p.canVerify || p.canManageUsers, 'Only Station Managers or Super Admins can verify dispatches');
    if (a instanceof NextResponse) return a;

    const { id } = await params;
    const dispatchId = parseInt(id);
    const row = await getScopedDispatch(dispatchId, a.stationScope);
    if (!row) {
      return NextResponse.json({ message: 'Dispatch record not found or outside office scope' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || (body.status === 'Rejected' ? 'reject' : 'verify');
    const reason = (body.rejectionReason || body.reason || '').trim();

    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ message: 'A rejection reason is mandatory when rejecting a dispatch record.' }, { status: 400 });
      }

      await db
        .update(s.emsDispatches)
        .set({
          status: 'Rejected',
          rejectionReason: reason,
          verifiedByUserId: a.user.sub,
          verifiedAt: new Date(),
        })
        .where(eq(s.emsDispatches.id, dispatchId));

      await logAudit('EMS Dispatch Rejected', a.user.sub, req, `${row.referenceId}: ${reason}`);

      // Notify the officer who created it
      if (row.createdByUserId) {
        await notifyUsers(
          [row.createdByUserId],
          'EntryRejected',
          `EMS dispatch entry ${row.referenceId} was rejected by Manager: "${reason}". Please review and correct.`,
          { dispatchId: row.id }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Dispatch ${row.referenceId} has been rejected.`,
        status: 'Rejected',
      });
    } else {
      // Verify
      await db
        .update(s.emsDispatches)
        .set({
          status: 'Verified',
          rejectionReason: null,
          verifiedByUserId: a.user.sub,
          verifiedAt: new Date(),
        })
        .where(eq(s.emsDispatches.id, dispatchId));

      await logAudit('EMS Dispatch Verified', a.user.sub, req, `${row.referenceId} (${formatGHS(row.cost)})`);

      return NextResponse.json({
        success: true,
        message: `Dispatch ${row.referenceId} verified successfully.`,
        status: 'Verified',
      });
    }
  } catch (err: any) {
    return serverError(err, 'verify dispatch');
  }
}
