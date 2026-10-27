import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, disposals, assetHistory, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';

const disposeSchema = z.object({
  disposalMethod: z.enum(['Auction', 'Scrapped', 'Donated', 'Written_Off']),
  disposalDate: z.string(),
  realisedValue: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin') return forbiddenResponse('Only Super Admins can dispose of assets');

    const { id } = await params;
    const body = await req.json();
    const parsed = disposeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const [asset] = await db.select().from(assets).where(eq(assets.assetId, id)).limit(1);
    if (!asset) return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    if (asset.status === 'Disposed') {
      return NextResponse.json({ message: 'Asset is already disposed' }, { status: 409 });
    }

    const { disposalMethod, disposalDate, realisedValue, notes } = parsed.data;

    await db.transaction(async (tx) => {
      // Record the disposal
      await tx.insert(disposals).values({
        assetId: id,
        disposalMethod,
        authorisedByUserId: caller.sub,
        disposalDate: new Date(disposalDate),
        realisedValue: realisedValue || null,
        notes: notes || null,
      });

      // Update asset status
      await tx.update(assets).set({ status: 'Disposed', updatedAt: new Date() }).where(eq(assets.assetId, id));

      // Log history
      await tx.insert(assetHistory).values({
        assetId: id,
        actionType: 'Disposed',
        description: `Asset disposed via ${disposalMethod.replace('_', ' ')}. ${notes ? `Notes: ${notes}` : ''}${realisedValue ? ` Realised Value: GHS ${realisedValue}` : ''}`.trim(),
        userId: caller.sub,
      });

      // Audit
      await tx.insert(auditLogs).values({
        action: 'Asset Disposed',
        userId: caller.sub,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        affectedRecord: id,
      });
    });

    return NextResponse.json({ success: true, message: `Asset ${id} disposed successfully.` });
  } catch (err: any) {
    console.error('Dispose asset error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
