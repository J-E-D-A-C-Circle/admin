import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import { emsAuth, serverError, isDuplicateOn } from '@/lib/ems-server';
import { logAudit } from '@/lib/audit-helper';

/** Adds a department under a station. */
export async function POST(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canManageUsers, 'Only IT Admins and Super Admins can add departments');
    if (a instanceof NextResponse) return a;

    const body = await req.json().catch(() => ({}));
    const stationId = Number(body?.stationId);
    const name = String(body?.name ?? '').trim();
    const code = String(body?.code ?? '').trim().toUpperCase() || null;

    if (!Number.isInteger(stationId) || !name) {
      return NextResponse.json({ success: false, message: 'Station and department name are required' }, { status: 400 });
    }
    if (name.length > 100 || (code && code.length > 20)) {
      return NextResponse.json({ success: false, message: 'One of the values is too long' }, { status: 400 });
    }

    const [station] = await db
      .select({ id: s.stations.id, name: s.stations.name })
      .from(s.stations)
      .where(and(eq(s.stations.id, stationId), isNull(s.stations.deletedAt)))
      .limit(1);
    if (!station) {
      return NextResponse.json({ success: false, message: 'Selected station does not exist' }, { status: 400 });
    }

    try {
      const [result] = await db.insert(s.emsDepartments).values({
        stationId,
        name,
        code,
        createdByUserId: a.user.sub,
      });
      const id = (result as any).insertId as number;
      await logAudit('Department Created', a.user.sub, req, `Department #${id}: ${name} @ ${station.name}`);
      return NextResponse.json({ success: true, data: { id, stationId, name, code } }, { status: 201 });
    } catch (err: any) {
      if (isDuplicateOn(err, 'uq_ems_dept_station_name')) {
        return NextResponse.json(
          { success: false, message: `${station.name} already has a department named "${name}"` },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err: any) {
    return serverError(err, 'create department');
  }
}
