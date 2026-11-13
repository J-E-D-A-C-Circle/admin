import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, assetHistory } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const bulkEditSchema = z.object({
  assetIds: z.array(z.string()).min(1),
  updates: z.object({
    departmentId: z.number().int().positive().optional(),
    status: z.enum(['Active', 'Under_Maintenance', 'Obsolete']).optional(),
  }).refine((data) => data.departmentId !== undefined || data.status !== undefined, {
    message: "At least one field to update must be provided",
  })
});

export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    
    // Check role, for simplicity we allow Admins and Asset Officers
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Permission denied to batch edit assets');
    }

    const body = await req.json();
    const parsed = bulkEditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { assetIds, updates } = parsed.data;

    // Fetch existing assets
    const existingAssets = await db.select().from(assets).where(inArray(assets.assetId, assetIds));
    if (existingAssets.length === 0) {
      return NextResponse.json({ message: 'No valid assets found' }, { status: 404 });
    }

    const validAssets = existingAssets;

    const validAssetIds = validAssets.map(a => a.assetId);

    await db.transaction(async (tx) => {
      // 1. Update Assets
      await tx
        .update(assets)
        .set(updates)
        .where(inArray(assets.assetId, validAssetIds));

      // 2. Insert History records
      const historyRecords = [];
      for (const asset of validAssets) {
        if (updates.departmentId && updates.departmentId !== asset.departmentId) {
          historyRecords.push({
            assetId: asset.assetId,
            actionType: 'DepartmentChange' as const,
            description: `Batch Edit: Department changed from ${asset.departmentId} to ${updates.departmentId}`,
            userId: caller.sub,
          });
        }
        if (updates.status && updates.status !== asset.status) {
          historyRecords.push({
            assetId: asset.assetId,
            actionType: 'StatusChange' as const,
            description: `Batch Edit: Status changed from ${asset.status} to ${updates.status}`,
            userId: caller.sub,
          });
        }
      }
      if (historyRecords.length > 0) {
        await tx.insert(assetHistory).values(historyRecords);
      }
    });

    await logAudit('Batch Edited Assets', caller.sub, req, `Count: ${validAssets.length}`);
    return NextResponse.json({ success: true, count: validAssets.length }, { status: 200 });
  } catch (err: any) {
    console.error('Batch edit asset error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
