import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assetVerifications } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const stats = await db
      .select({
        status: assetVerifications.status,
        count: sql<number>`count(*)`,
      })
      .from(assetVerifications)
      .groupBy(assetVerifications.status);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(assetVerifications)
      .then((res) => res[0]?.count || 0);

    const result = {
      total,
      verified: 0,
      missing: 0,
      damaged: 0,
    };

    for (const stat of stats) {
      if (stat.status === 'Verified') result.verified = Number(stat.count);
      else if (stat.status === 'Missing') result.missing = Number(stat.count);
      else if (stat.status === 'Damaged') result.damaged = Number(stat.count);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Fetch verification stats error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
