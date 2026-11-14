import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import {
  auditCampaigns,
  auditCampaignItems,
  assets,
  stations,
  assetCategories,
  assetVerifications,
  users,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';
import { ensureSchema } from '@/lib/ensureSchema';

const patchCampaignSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('scan'),
    assetId: z.string().min(1),
    status: z.enum(['Verified', 'Missing', 'Damaged']).default('Verified'),
    notes: z.string().optional().nullable(),
  }),
  z.object({
    action: z.literal('complete'),
    markRemainingMissing: z.boolean().optional(),
  }),
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { id } = await params;
    const campaignId = Number.parseInt(id, 10);
    if (!Number.isFinite(campaignId) || campaignId <= 0) {
      return NextResponse.json({ message: 'Invalid campaign ID' }, { status: 400 });
    }

    const [campaign] = await db
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
      })
      .from(auditCampaigns)
      .leftJoin(stations, eq(auditCampaigns.stationId, stations.id))
      .leftJoin(assetCategories, eq(auditCampaigns.categoryId, assetCategories.id))
      .where(eq(auditCampaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ message: 'Audit campaign not found' }, { status: 404 });
    }

    const items = await db
      .select({
        id: auditCampaignItems.id,
        assetId: auditCampaignItems.assetId,
        assetName: assets.name,
        serialNumber: assets.serialNumber,
        subLocation: assets.subLocation,
        stationName: stations.name,
        categoryName: assetCategories.name,
        status: auditCampaignItems.status,
        scannedAt: auditCampaignItems.scannedAt,
        scannedByName: users.name,
        notes: auditCampaignItems.notes,
      })
      .from(auditCampaignItems)
      .innerJoin(assets, eq(auditCampaignItems.assetId, assets.assetId))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(users, eq(auditCampaignItems.scannedByUserId, users.id))
      .where(eq(auditCampaignItems.campaignId, campaignId));

    return NextResponse.json({ campaign, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fetch campaign detail error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { id } = await params;
    const campaignId = Number.parseInt(id, 10);
    if (!Number.isFinite(campaignId) || campaignId <= 0) {
      return NextResponse.json({ message: 'Invalid campaign ID' }, { status: 400 });
    }

    const [campaign] = await db
      .select()
      .from(auditCampaigns)
      .where(eq(auditCampaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ message: 'Audit campaign not found' }, { status: 404 });
    }
    if (campaign.status === 'Completed') {
      return NextResponse.json({ message: 'This audit campaign is already completed.' }, { status: 409 });
    }

    const body = await req.json();
    const parsed = patchCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    if (parsed.data.action === 'scan') {
      const { assetId, status, notes } = parsed.data;
      const [item] = await db
        .select()
        .from(auditCampaignItems)
        .where(
          and(
            eq(auditCampaignItems.campaignId, campaignId),
            eq(auditCampaignItems.assetId, assetId)
          )
        )
        .limit(1);

      if (!item) {
        return NextResponse.json(
          { message: `Asset ${assetId} is not part of this audit campaign.` },
          { status: 404 }
        );
      }

      const now = new Date();
      await db.transaction(async (tx) => {
        await tx
          .update(auditCampaignItems)
          .set({
            status,
            scannedAt: now,
            scannedByUserId: caller.sub,
            notes: notes || null,
          })
          .where(eq(auditCampaignItems.id, item.id));

        await tx
          .update(assets)
          .set({
            lastVerificationDate: now,
            ...(status === 'Damaged' ? { status } : {}),
            updatedAt: now,
          })
          .where(eq(assets.assetId, assetId));

        await tx.insert(assetVerifications).values({
          assetId,
          verifiedByUserId: caller.sub,
          verificationType: 'Quarterly',
          status,
          comments: notes ? `[Campaign: ${campaign.title}] ${notes}` : `[Campaign: ${campaign.title}]`,
        });
      });

      await logAudit(`Campaign Scan (${status})`, caller.sub, req, `${campaign.title} - ${assetId}`);
      return NextResponse.json({ success: true, message: `${assetId} marked as ${status}` });
    }

    if (parsed.data.action === 'complete') {
      // Complete campaign
      const markMissing = Boolean(parsed.data.markRemainingMissing);
      const now = new Date();
      await db.transaction(async (tx) => {
        if (markMissing) {
          await tx
            .update(auditCampaignItems)
            .set({
              status: 'Missing',
              scannedAt: now,
              scannedByUserId: caller.sub,
              notes: 'Unscanned at campaign close',
            })
            .where(
              and(
                eq(auditCampaignItems.campaignId, campaignId),
                eq(auditCampaignItems.status, 'Pending')
              )
            );
        }

        await tx
          .update(auditCampaigns)
          .set({ status: 'Completed', completedAt: now })
          .where(eq(auditCampaigns.id, campaignId));
      });

      await logAudit(`Completed Audit Campaign: ${campaign.title}`, caller.sub, req, `Campaign #${campaignId}`);
      return NextResponse.json({ success: true, message: 'Audit campaign completed' });
    }

    return NextResponse.json({ message: 'Unsupported action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Update audit campaign error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
