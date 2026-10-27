import { db } from '@/db';
import * as schema from '@/db/schema';
import { NextRequest } from 'next/server';

export async function logAudit(
  action: string,
  userId: number | null,
  req: NextRequest,
  affectedRecord?: string
): Promise<void> {
  try {
    // Get IP address from headers
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    await db.insert(schema.auditLogs).values({
      action,
      userId,
      ipAddress: ip,
      affectedRecord: affectedRecord || null,
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}
