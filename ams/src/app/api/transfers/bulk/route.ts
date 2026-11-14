import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, assetTransfers, assetHistory, notifications, regions, stations, departments } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const bulkTransferSchema = z.object({
  assetIds: z.array(z.string()).min(1),
  toRegionId: z.number().int().positive(),
  toStationId: z.number().int().positive(),
  toDepartmentId: z.number().int().positive(),
  newEmployeeId: z.number().int().positive().optional().nullable(),
  reason: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Permission denied to initiate asset transfers');
    }

    const body = await req.json();
    const parsed = bulkTransferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { assetIds, toRegionId, toStationId, toDepartmentId, newEmployeeId, reason } = parsed.data;

    // Fetch existing assets
    const existingAssets = await db.select().from(assets).where(inArray(assets.assetId, assetIds));
    if (existingAssets.length === 0) {
      return NextResponse.json({ message: 'No valid assets found' }, { status: 404 });
    }

    const validAssets = existingAssets;

    const [allRegions, allStations, allDepts] = await Promise.all([
      db.select({ id: regions.id, name: regions.name }).from(regions),
      db.select({ id: stations.id, name: stations.name }).from(stations),
      db.select({ id: departments.id, name: departments.name }).from(departments),
    ]);
    const regName = (id: number | null) => allRegions.find((r) => r.id === id)?.name || `Region #${id}`;
    const staName = (id: number | null) => allStations.find((s) => s.id === id)?.name || `Station #${id}`;
    const deptName = (id: number | null) => allDepts.find((d) => d.id === id)?.name || `Dept #${id}`;
    const now = new Date();

    await db.transaction(async (tx) => {
      for (const asset of validAssets) {
        const isSameStation = asset.stationId === toStationId;
        const isSameDept = asset.departmentId === toDepartmentId;
        const actionType = !isSameStation
          ? 'StationChange'
          : !isSameDept
            ? 'DepartmentChange'
            : 'EmployeeReassignment';
        const fromSummary = `${regName(asset.regionId)} / ${staName(asset.stationId)} / ${deptName(asset.departmentId)}`;
        const toSummary = `${regName(toRegionId)} / ${staName(toStationId)} / ${deptName(toDepartmentId)}`;

        // 1. Insert completed Transfer record
        await tx.insert(assetTransfers).values({
          assetId: asset.assetId,
          fromRegionId: asset.regionId,
          toRegionId,
          fromStationId: asset.stationId,
          toStationId,
          fromDepartmentId: asset.departmentId,
          toDepartmentId,
          previousEmployeeId: asset.assignedEmployeeId,
          newEmployeeId: newEmployeeId ?? null,
          reason,
          transferredByUserId: caller.sub,
          transferDate: now,
          status: 'Approved',
          approvedByUserId: caller.sub,
          approvalDate: now,
        });

        // 2. Immediately update Asset location
        await tx
          .update(assets)
          .set({
            regionId: toRegionId,
            stationId: toStationId,
            departmentId: toDepartmentId,
            assignedEmployeeId: newEmployeeId ?? null,
            updatedAt: now,
          })
          .where(eq(assets.assetId, asset.assetId));

        // 3. Log From -> To history
        await tx.insert(assetHistory).values({
          assetId: asset.assetId,
          actionType,
          description: `Bulk transferred by ${caller.username} on ${now.toISOString()}: From [${fromSummary}] → To [${toSummary}]. Reason: ${reason}`,
          userId: caller.sub,
          createdAt: now,
        });

        // 4. Notification
        await tx.insert(notifications).values({
          type: 'AssetTransferred',
          message: `Asset ${asset.name} (${asset.assetId}) transferred by ${caller.username} from ${staName(asset.stationId)} to ${staName(toStationId)}.`,
          assetId: asset.assetId,
        });
      }
    });

    await logAudit('Bulk Transferred Assets', caller.sub, req, `Count: ${validAssets.length} -> ${staName(toStationId)} (${deptName(toDepartmentId)})`);
    return NextResponse.json({ success: true, count: validAssets.length }, { status: 201 });
  } catch (err: any) {
    console.error('Bulk transfer asset error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
