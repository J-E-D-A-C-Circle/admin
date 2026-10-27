import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assetHistory, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { id: assetId } = await params;

    const history = await db
      .select({
        id: assetHistory.id,
        assetId: assetHistory.assetId,
        actionType: assetHistory.actionType,
        description: assetHistory.description,
        createdAt: assetHistory.createdAt,
        userId: assetHistory.userId,
        userName: users.name,
        userUsername: users.username,
      })
      .from(assetHistory)
      .leftJoin(users, eq(assetHistory.userId, users.id))
      .where(eq(assetHistory.assetId, assetId))
      .orderBy(assetHistory.createdAt); // oldest first for timeline, or desc? typically desc for recent first, but we can do desc

    return NextResponse.json(history);
  } catch (err: any) {
    console.error('Fetch asset history error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
