import { NextRequest, NextResponse } from 'next/server';
import { eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import { emsAuth, serverError, isDuplicateOn } from '@/lib/ems-server';
import { logAudit } from '@/lib/audit-helper';

/** Lists regions and every active station together with its departments. */
export async function GET(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canManageUsers || p.canViewCompliance);
    if (a instanceof NextResponse) return a;

    const regionRows = await db.select().from(s.regions).orderBy(s.regions.name);
    const stationRows = await db
      .select({
        id: s.stations.id,
        name: s.stations.name,
        code: s.stations.code,
        location: s.stations.location,
        regionId: s.stations.regionId,
      })
      .from(s.stations)
      .where(isNull(s.stations.deletedAt))
      .orderBy(s.stations.name);
    const deptRows = await db.select().from(s.emsDepartments).orderBy(s.emsDepartments.name);

    const stations = stationRows.map((st) => ({
      ...st,
      regionName: regionRows.find((r) => r.id === st.regionId)?.name ?? '',
      departments: deptRows
        .filter((d) => d.stationId === st.id)
        .map((d) => ({ id: d.id, name: d.name, code: d.code })),
    }));

    return NextResponse.json({
      success: true,
      regions: regionRows.map((r) => ({ id: r.id, name: r.name, code: r.code })),
      stations,
      canManage: a.perms.canManageUsers,
    });
  } catch (err: any) {
    return serverError(err, 'list stations and departments');
  }
}

/** Creates a new station (office) under a region. */
export async function POST(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canManageUsers, 'Only IT Admins and Super Admins can add stations');
    if (a instanceof NextResponse) return a;

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? '').trim();
    const code = String(body?.code ?? '').trim().toUpperCase();
    const location = String(body?.location ?? '').trim() || null;
    const regionId = Number(body?.regionId);

    if (!name || !code || !Number.isInteger(regionId)) {
      return NextResponse.json(
        { success: false, message: 'Station name, code and region are required' },
        { status: 400 }
      );
    }
    if (name.length > 100 || code.length > 20 || (location && location.length > 150)) {
      return NextResponse.json({ success: false, message: 'One of the values is too long' }, { status: 400 });
    }

    const [region] = await db.select({ id: s.regions.id }).from(s.regions).where(eq(s.regions.id, regionId)).limit(1);
    if (!region) {
      return NextResponse.json({ success: false, message: 'Selected region does not exist' }, { status: 400 });
    }

    try {
      const [result] = await db.insert(s.stations).values({ name, code, location, regionId });
      const id = (result as any).insertId as number;
      await logAudit('Station Created', a.user.sub, req, `Station #${id}: ${name} (${code})`);
      return NextResponse.json({ success: true, data: { id, name, code, location, regionId, departments: [] } }, { status: 201 });
    } catch (err: any) {
      if (isDuplicateOn(err, 'name')) {
        return NextResponse.json({ success: false, message: 'A station with this name already exists' }, { status: 409 });
      }
      if (isDuplicateOn(err, 'code')) {
        return NextResponse.json({ success: false, message: 'A station with this code already exists' }, { status: 409 });
      }
      throw err;
    }
  } catch (err: any) {
    return serverError(err, 'create station');
  }
}
