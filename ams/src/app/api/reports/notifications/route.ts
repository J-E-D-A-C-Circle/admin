import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, assets } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const list = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        message: notifications.message,
        assetId: notifications.assetId,
        assetName: assets.name,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .leftJoin(assets, eq(notifications.assetId, assets.assetId))
      .orderBy(sql`${notifications.createdAt} DESC`)
      .limit(50);

    return NextResponse.json(list);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fetch notifications error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Mark all notifications read error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
