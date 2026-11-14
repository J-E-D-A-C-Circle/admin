import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import {
  auditCampaigns,
  auditCampaignItems,
  assets,
  stations,
  assetCategories,
  users,
} from '@/db/schema';
import { eq, and, ne, desc } from 'drizzle-orm';
import { verifyAuth, getScopeWhere, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';
import { ensureSchema } from '@/lib/ensureSchema';

const createCampaignSchema = z.object({
  title: z.string().min(3).max(200),
  stationId: z.number().int().positive().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const campaigns = await db
      .select({
        id: auditCampaigns.id,
        title: auditCampaigns.title,
        stationId: auditCampaigns.stationId,
        stationName: stations.name,
        categoryId: auditCampaigns.categoryId,
        categoryName: assetCategories.name,
        status: auditCampaigns.status,
        startedAt: auditCampaigns.startedAt,
        completedAt: auditCampaigns.completedAt,
        createdByName: users.name,
      })
      .from(auditCampaigns)
      .leftJoin(stations, eq(auditCampaigns.stationId, stations.id))
      .leftJoin(assetCategories, eq(auditCampaigns.categoryId, assetCategories.id))
      .leftJoin(users, eq(auditCampaigns.createdByUserId, users.id))
      .orderBy(desc(auditCampaigns.startedAt));

    const allItems = await db
      .select({
        campaignId: auditCampaignItems.campaignId,
        status: auditCampaignItems.status,
      })
      .from(auditCampaignItems);

    const statsMap = new Map<
      number,
      { total: number; verified: number; missing: number; damaged: number; pending: number }
    >();
    for (const item of allItems) {
      const s = statsMap.get(item.campaignId) || {
        total: 0,
        verified: 0,
        missing: 0,
        damaged: 0,
        pending: 0,
      };
      s.total++;
      if (item.status === 'Verified') s.verified++;
      else if (item.status === 'Missing') s.missing++;
      else if (item.status === 'Damaged') s.damaged++;
      else s.pending++;
      statsMap.set(item.campaignId, s);
    }

    const enriched = campaigns.map((c) => ({
      ...c,
      stats: statsMap.get(c.id) || { total: 0, verified: 0, missing: 0, damaged: 0, pending: 0 },
    }));

    return NextResponse.json(enriched);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fetch audit campaigns error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer' && caller.role !== 'Auditor') {
      return forbiddenResponse('Permission denied to create audit campaigns');
    }

    const body = await req.json();
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { title, stationId, categoryId } = parsed.data;
    const scope = getScopeWhere(caller);

    const conditions = [ne(assets.status, 'Obsolete')];
    if (stationId) conditions.push(eq(assets.stationId, stationId));
    else if (scope.stationId) conditions.push(eq(assets.stationId, scope.stationId));
    if (scope.regionId && !stationId) conditions.push(eq(assets.regionId, scope.regionId));
    if (categoryId) conditions.push(eq(assets.categoryId, categoryId));

    const targetAssets = await db
      .select({ assetId: assets.assetId })
      .from(assets)
      .where(and(...conditions));

    if (targetAssets.length === 0) {
      return NextResponse.json(
        { message: 'No active assets match the selected station/category filter.' },
        { status: 400 }
      );
    }

    const campaignId = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(auditCampaigns)
        .values({
          title,
          stationId: stationId || null,
          categoryId: categoryId || null,
          status: 'Active',
          createdByUserId: caller.sub,
        });

      const newId = inserted.insertId;
      await tx.insert(auditCampaignItems).values(
        targetAssets.map((a) => ({
          campaignId: newId,
          assetId: a.assetId,
          status: 'Pending' as const,
        }))
      );

      return newId;
    });

    await logAudit(`Started Audit Campaign: ${title}`, caller.sub, req, `Campaign #${campaignId}`);
    return NextResponse.json({ id: campaignId, totalItems: targetAssets.length }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Create audit campaign error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
