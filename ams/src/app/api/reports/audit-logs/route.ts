import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { eq, and, or, like, desc, sql, count as countFn } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Auditor') {
      return forbiddenResponse('Access restricted to Super Admins and Auditors');
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(auditLogs.action, term),
          like(auditLogs.affectedRecord, term),
          like(auditLogs.ipAddress, term),
          like(users.name, term),
          like(users.username, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch logs
    const dataQuery = db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        userId: auditLogs.userId,
        userName: users.name,
        userUsername: users.username,
        createdAt: auditLogs.createdAt,
        ipAddress: auditLogs.ipAddress,
        affectedRecord: auditLogs.affectedRecord,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Count logs
    const countQuery = db
      .select({ value: countFn() })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause);

    const [rows, totalResult] = await Promise.all([dataQuery, countQuery]);
    const total = totalResult[0]?.value || 0;

    return NextResponse.json({
      data: rows,
      total,
      page,
      limit,
    });
  } catch (err: any) {
    console.error('Fetch audit logs error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
