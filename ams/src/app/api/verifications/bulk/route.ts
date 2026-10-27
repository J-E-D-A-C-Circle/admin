import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, assetVerifications, assetHistory, notifications } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const bulkVerificationSchema = z.object({
  assetIds: z.array(z.string().min(1)).min(1),
  verificationType: z.enum(['Quarterly', 'Half_Yearly', 'Annual']),
  status: z.enum(['Verified', 'Missing', 'Damaged']),
  comments: z.string().optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  verifiedAtStationId: z.number().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Only Super Admins and Asset Officers can submit verification audits');
    }

    const body = await req.json();
    const parsed = bulkVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { assetIds, verificationType, status, comments, latitude, longitude, verifiedAtStationId } = parsed.data;

    // Fetch existing assets to verify they exist and check for discrepancies
    const existingAssets = await db.select().from(assets).where(inArray(assets.assetId, assetIds));
    if (existingAssets.length === 0) {
      return NextResponse.json({ message: 'No valid assets found' }, { status: 404 });
    }

    const assetStatusMap = {
      Verified: 'Active' as const,
      Missing: 'Missing' as const,
      Damaged: 'Damaged' as const,
    };
    const targetAssetStatus = assetStatusMap[status];

    await db.transaction(async (tx) => {
      for (const asset of existingAssets) {
        // 1. Insert Verification audit record
        await tx.insert(assetVerifications).values({
          assetId: asset.assetId,
          verificationType,
          status,
          comments: comments ?? null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          verifiedAtStationId: verifiedAtStationId ?? null,
          verifiedByUserId: caller.sub,
        });

        // 2. Update Asset status and last verification date
        await tx
          .update(assets)
          .set({
            status: targetAssetStatus,
            lastVerificationDate: new Date(),
          })
          .where(eq(assets.assetId, asset.assetId));

        // 3. Insert History log
        let desc = `${verificationType} bulk verification completed. Result: ${status}. ${comments || ''}`;
        if (verifiedAtStationId && asset.stationId !== verifiedAtStationId) {
          desc += ` [DISCREPANCY: Verified at a different station]`;
        }
        await tx.insert(assetHistory).values({
          assetId: asset.assetId,
          actionType: 'StatusChange',
          description: desc.trim(),
          userId: caller.sub,
        });

        // 4. Create Notification if Missing or Damaged
        if (status === 'Missing' || status === 'Damaged') {
          await tx.insert(notifications).values({
            type: status === 'Missing' ? 'AssetMissing' : 'AssetUpdated',
            message: `Asset ${asset.name} (${asset.assetId}) marked ${status} in ${verificationType} bulk verification`,
            assetId: asset.assetId,
          });
        }
      }
    });

    await logAudit(`Bulk Verified ${existingAssets.length} Assets`, caller.sub, req, 'Multiple Assets');
    return NextResponse.json({ success: true, count: existingAssets.length }, { status: 201 });
  } catch (err: any) {
    console.error('Bulk create verification error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
