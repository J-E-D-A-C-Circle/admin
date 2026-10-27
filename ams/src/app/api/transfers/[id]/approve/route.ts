import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, assetTransfers, assetHistory, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';
import fs from 'fs';
import path from 'path';

const approveSchema = z.object({
  signatureDataUrl: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { id } = await params;
    const transferId = parseInt(id);
    if (isNaN(transferId)) {
      return NextResponse.json({ message: 'Invalid transfer ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { signatureDataUrl } = parsed.data;

    const [transfer] = await db.select().from(assetTransfers).where(eq(assetTransfers.id, transferId)).limit(1);
    if (!transfer) {
      return NextResponse.json({ message: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status !== 'Pending') {
      return NextResponse.json({ message: 'Transfer is not pending' }, { status: 400 });
    }

    // Process signature image
    const matches = signatureDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let signatureUrl = '';
    if (matches && matches.length === 3) {
      const buffer = Buffer.from(matches[2], 'base64');
      const fileName = `sig_${transferId}_${Date.now()}.png`;
      const publicDir = path.join(process.cwd(), 'public', 'uploads', 'signatures');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(path.join(publicDir, fileName), buffer);
      signatureUrl = `/uploads/signatures/${fileName}`;
    }

    await db.transaction(async (tx) => {
      // 1. Update transfer status
      await tx
        .update(assetTransfers)
        .set({
          status: 'Approved',
          approvedByUserId: caller.sub,
          approvalDate: new Date(),
          signatureUrl,
        })
        .where(eq(assetTransfers.id, transferId));

      // 2. Update asset location
      await tx
        .update(assets)
        .set({
          regionId: transfer.toRegionId,
          stationId: transfer.toStationId,
          departmentId: transfer.toDepartmentId,
          assignedEmployeeId: transfer.newEmployeeId,
          status: 'Active',
        })
        .where(eq(assets.assetId, transfer.assetId));

      // 3. Insert History records
      await tx.insert(assetHistory).values([
        {
          assetId: transfer.assetId,
          actionType: 'StationChange',
          description: `Transfer Approved: Moved from station ID ${transfer.fromStationId} to station ID ${transfer.toStationId}`,
          userId: caller.sub,
        },
      ]);

      // 4. Notification
      await tx.insert(notifications).values({
        type: 'AssetTransferred',
        message: `Transfer for Asset ${transfer.assetId} has been approved.`,
        assetId: transfer.assetId,
      });
    });

    await logAudit('Approved Transfer', caller.sub, req, transfer.assetId);

    return NextResponse.json({ success: true, signatureUrl }, { status: 200 });
  } catch (err: any) {
    console.error('Approve transfer error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
