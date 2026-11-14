import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, assetAttachments, users } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';
import { ensureSchema } from '@/lib/ensureSchema';

const createAttachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  docType: z.enum(['Photo', 'Invoice', 'Warranty', 'Other']).default('Photo'),
  fileUrl: z.string().min(1).max(500),
  mimeType: z.string().max(100).optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { id: assetId } = await params;

    const rows = await db
      .select({
        id: assetAttachments.id,
        assetId: assetAttachments.assetId,
        fileName: assetAttachments.fileName,
        docType: assetAttachments.docType,
        fileUrl: assetAttachments.fileUrl,
        mimeType: assetAttachments.mimeType,
        createdAt: assetAttachments.createdAt,
        uploadedByName: users.name,
      })
      .from(assetAttachments)
      .leftJoin(users, eq(assetAttachments.uploadedByUserId, users.id))
      .where(eq(assetAttachments.assetId, assetId))
      .orderBy(desc(assetAttachments.createdAt));

    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fetch attachments error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Only Super Admins and Asset Officers can upload asset attachments');
    }

    const { id: assetId } = await params;
    const [asset] = await db.select({ assetId: assets.assetId }).from(assets).where(eq(assets.assetId, assetId)).limit(1);
    if (!asset) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createAttachmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    await db.insert(assetAttachments).values({
      assetId,
      fileName: parsed.data.fileName,
      docType: parsed.data.docType,
      fileUrl: parsed.data.fileUrl,
      mimeType: parsed.data.mimeType || null,
      uploadedByUserId: caller.sub,
    });

    await logAudit(`Attached ${parsed.data.docType} (${parsed.data.fileName})`, caller.sub, req, assetId);
    return NextResponse.json({ success: true, message: 'Attachment added successfully' }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Create attachment error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Only Super Admins and Asset Officers can remove asset attachments');
    }

    const { id: assetId } = await params;
    const { searchParams } = new URL(req.url);
    const attachmentId = Number.parseInt(searchParams.get('attachmentId') || '', 10);
    if (!Number.isFinite(attachmentId) || attachmentId <= 0) {
      return NextResponse.json({ message: 'Valid attachmentId query parameter is required' }, { status: 400 });
    }

    await db
      .delete(assetAttachments)
      .where(and(eq(assetAttachments.id, attachmentId), eq(assetAttachments.assetId, assetId)));

    await logAudit(`Removed attachment #${attachmentId}`, caller.sub, req, assetId);
    return NextResponse.json({ success: true, message: 'Attachment removed' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Delete attachment error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
