import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, assetTransfers, notifications } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const bulkTransferSchema = z.object({
  assetIds: z.array(z.string()).min(1),
  toRegionId: z.number().int().positive(),
  toStationId: z.number().int().positive(),
  toDepartmentId: z.number().int().positive(),
  reason: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Regional Manager' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Permission denied to initiate asset transfers');
    }

    const body = await req.json();
    const parsed = bulkTransferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { assetIds, toRegionId, toStationId, toDepartmentId, reason } = parsed.data;

    // Fetch existing assets
    const existingAssets = await db.select().from(assets).where(inArray(assets.assetId, assetIds));
    if (existingAssets.length === 0) {
      return NextResponse.json({ message: 'No valid assets found' }, { status: 404 });
    }

    // Filter out assets not in regional manager's scope
    const validAssets = caller.role === 'Regional Manager'
      ? existingAssets.filter(a => a.regionId === caller.regionId)
      : existingAssets;

    if (validAssets.length === 0) {
      return forbiddenResponse('No valid assets in your region to transfer');
    }

    await db.transaction(async (tx) => {
      for (const asset of validAssets) {
        // 1. Insert Transfer record (Pending)
        await tx.insert(assetTransfers).values({
          assetId: asset.assetId,
          fromRegionId: asset.regionId,
          toRegionId,
          fromStationId: asset.stationId,
          toStationId,
          fromDepartmentId: asset.departmentId,
          toDepartmentId,
          previousEmployeeId: asset.assignedEmployeeId,
          newEmployeeId: null,
          reason,
          transferredByUserId: caller.sub,
          status: 'Pending',
        });

        // 2. Notification
        await tx.insert(notifications).values({
          type: 'AssetTransferred',
          message: `A bulk transfer for Asset ${asset.name} (${asset.assetId}) has been initiated and is pending approval.`,
          assetId: asset.assetId,
        });
      }
    });

    await logAudit('Bulk Transferred Assets', caller.sub, req, `Count: ${validAssets.length}`);
    return NextResponse.json({ success: true, count: validAssets.length }, { status: 201 });
  } catch (err: any) {
    console.error('Bulk transfer asset error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
