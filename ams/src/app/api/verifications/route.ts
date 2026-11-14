import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, assetVerifications, assetHistory, notifications, users } from '@/db/schema';
import { eq, and, sql, like, or, count as countFn } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const createVerificationSchema = z.object({
  assetId: z.string().min(1),
  verificationType: z.enum(['Quarterly', 'Half_Yearly', 'Annual']),
  status: z.enum(['Verified', 'Missing', 'Damaged']),
  comments: z.string().optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  verifiedAtStationId: z.number().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    const conditions: any[] = [
      sql`${assetVerifications.id} IN (SELECT MAX(id) FROM asset_verifications GROUP BY asset_id)`
    ];
    if (search) {
      const term = `%${search}%`;
      conditions.push(or(like(assetVerifications.assetId, term), like(assets.name, term)));
    }
    
    const statusFilter = searchParams.get('status');
    if (statusFilter) {
      conditions.push(eq(assetVerifications.status, statusFilter as any));
    }
    
    const typeFilter = searchParams.get('verificationType');
    if (typeFilter) {
      conditions.push(eq(assetVerifications.verificationType, typeFilter as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: assetVerifications.id,
          assetId: assetVerifications.assetId,
          assetName: assets.name,
          station: sql<string>`(SELECT s.name FROM stations s WHERE s.id = ${assets.stationId})`,
          region: sql<string>`(SELECT r.name FROM regions r WHERE r.id = ${assets.regionId})`,
          verificationDate: assetVerifications.verificationDate,
          verificationType: assetVerifications.verificationType,
          status: assetVerifications.status,
          comments: assetVerifications.comments,
          photoUrl: assetVerifications.photoUrl,
          latitude: assetVerifications.latitude,
          longitude: assetVerifications.longitude,
          verifiedBy: users.name,
        })
        .from(assetVerifications)
        .leftJoin(assets, eq(assetVerifications.assetId, assets.assetId))
        .leftJoin(users, eq(assetVerifications.verifiedByUserId, users.id))
        .where(whereClause)
        .orderBy(sql`${assetVerifications.verificationDate} DESC`)
        .limit(limit)
        .offset(offset),
      db
        .select({ value: countFn() })
        .from(assetVerifications)
        .leftJoin(assets, eq(assetVerifications.assetId, assets.assetId))
        .where(whereClause),
    ]);

    return NextResponse.json({ data: rows, total: totalResult[0]?.value || 0, page, limit });
  } catch (err: any) {
    console.error('Fetch verifications error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Only Super Admins and Asset Officers can submit verification audits');
    }

    const body = await req.json();
    const parsed = createVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { assetId, verificationType, status, comments, latitude, longitude, verifiedAtStationId, photoUrl } = parsed.data;

    // Fetch existing asset
    const [existing] = await db.select().from(assets).where(eq(assets.assetId, assetId)).limit(1);
    if (!existing) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    const assetStatusMap: Partial<Record<'Verified' | 'Missing' | 'Damaged', 'Active' | 'Damaged'>> = {
      Verified: 'Active',
      Damaged: 'Damaged',
    };

    const targetAssetStatus = assetStatusMap[status];

    const result = await db.transaction(async (tx) => {
      // 1. Insert Verification audit record
      const [inserted] = await tx.insert(assetVerifications).values({
        assetId,
        verificationType,
        status,
        comments: comments ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        verifiedAtStationId: verifiedAtStationId ?? null,
        photoUrl: photoUrl ?? null,
        verifiedByUserId: caller.sub,
      });

      // 2. Update Asset status and last verification date
      await tx
        .update(assets)
        .set({
          ...(targetAssetStatus ? { status: targetAssetStatus } : {}),
          lastVerificationDate: new Date(),
        })
        .where(eq(assets.assetId, assetId));

      // 3. Insert History log
      let desc = `${verificationType} verification completed. Result: ${status}. ${comments || ''}`;
      if (verifiedAtStationId && existing.stationId !== verifiedAtStationId) {
        desc += ` [DISCREPANCY: Verified at a different station]`;
      }
      await tx.insert(assetHistory).values({
        assetId,
        actionType: 'StatusChange',
        description: desc.trim(),
        userId: caller.sub,
      });

      // 4. Create Notification if Missing or Damaged
      if (status === 'Missing' || status === 'Damaged') {
        await tx.insert(notifications).values({
          type: status === 'Missing' ? 'AssetMissing' : 'AssetUpdated',
          message: `Asset ${existing.name} (${assetId}) marked ${status} in ${verificationType} verification audit`,
          assetId,
        });
      }

      return { verificationId: inserted.insertId };
    });

    await logAudit('Verified Asset', caller.sub, req, assetId);
    return NextResponse.json({ verificationId: result.verificationId, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Create verification error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
