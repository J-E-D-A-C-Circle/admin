import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, assetTransfers, assetHistory, notifications, regions, stations, departments, employees, users } from '@/db/schema';
import { eq, and, sql, like, or, count as countFn } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const createTransferSchema = z.object({
  assetId: z.string().min(1),
  toRegionId: z.number().int().positive(),
  toStationId: z.number().int().positive(),
  toDepartmentId: z.number().int().positive(),
  newEmployeeId: z.number().int().positive().optional().nullable(),
  reason: z.string().min(1),
});

// Create table aliases for the multiple relations in transfers
const fromRegion = alias(regions, 'from_region');
const toRegion = alias(regions, 'to_region');
const fromStation = alias(stations, 'from_station');
const toStation = alias(stations, 'to_station');
const fromDept = alias(departments, 'from_dept');
const toDept = alias(departments, 'to_dept');
const prevEmp = alias(employees, 'prev_emp');
const newEmp = alias(employees, 'new_emp');
const transferUser = alias(users, 'transfer_user');

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(assetTransfers.assetId, term),
          like(assets.name, term),
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: assetTransfers.id,
          assetId: assetTransfers.assetId,
          assetName: assets.name,
          transferDate: assetTransfers.transferDate,
          reason: assetTransfers.reason,
          transferredBy: transferUser.name,
          transferredByUsername: transferUser.username,
          fromRegion: fromRegion.name,
          toRegion: toRegion.name,
          fromStation: fromStation.name,
          toStation: toStation.name,
          fromDepartment: fromDept.name,
          toDepartment: toDept.name,
          previousEmployee: prevEmp.name,
          newEmployee: newEmp.name,
          status: assetTransfers.status,
          approvedByUserId: assetTransfers.approvedByUserId,
          approvalDate: assetTransfers.approvalDate,
        })
        .from(assetTransfers)
        .leftJoin(assets, eq(assetTransfers.assetId, assets.assetId))
        .leftJoin(transferUser, eq(assetTransfers.transferredByUserId, transferUser.id))
        .leftJoin(fromRegion, eq(assetTransfers.fromRegionId, fromRegion.id))
        .leftJoin(toRegion, eq(assetTransfers.toRegionId, toRegion.id))
        .leftJoin(fromStation, eq(assetTransfers.fromStationId, fromStation.id))
        .leftJoin(toStation, eq(assetTransfers.toStationId, toStation.id))
        .leftJoin(fromDept, eq(assetTransfers.fromDepartmentId, fromDept.id))
        .leftJoin(toDept, eq(assetTransfers.toDepartmentId, toDept.id))
        .leftJoin(prevEmp, eq(assetTransfers.previousEmployeeId, prevEmp.id))
        .leftJoin(newEmp, eq(assetTransfers.newEmployeeId, newEmp.id))
        .where(whereClause)
        .orderBy(sql`${assetTransfers.transferDate} DESC`)
        .limit(limit)
        .offset(offset),
      db
        .select({ value: countFn() })
        .from(assetTransfers)
        .leftJoin(assets, eq(assetTransfers.assetId, assets.assetId))
        .where(whereClause),
    ]);

    return NextResponse.json({ data: rows, total: totalResult[0]?.value || 0, page, limit });
  } catch (err: any) {
    console.error('Fetch transfers error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Permission denied to initiate asset transfers');
    }

    const body = await req.json();
    const parsed = createTransferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { assetId, toRegionId, toStationId, toDepartmentId, newEmployeeId, reason } = parsed.data;

    // Fetch existing asset
    const [existing] = await db.select().from(assets).where(eq(assets.assetId, assetId)).limit(1);
    if (!existing) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    // Fetch lookup names for a clear "From -> To" audit trail
    const [allRegions, allStations, allDepts, allEmps] = await Promise.all([
      db.select({ id: regions.id, name: regions.name }).from(regions),
      db.select({ id: stations.id, name: stations.name }).from(stations),
      db.select({ id: departments.id, name: departments.name }).from(departments),
      db.select({ id: employees.id, name: employees.name }).from(employees),
    ]);
    const regName = (id: number | null) => allRegions.find((r) => r.id === id)?.name || `Region #${id}`;
    const staName = (id: number | null) => allStations.find((s) => s.id === id)?.name || `Station #${id}`;
    const deptName = (id: number | null) => allDepts.find((d) => d.id === id)?.name || `Dept #${id}`;
    const empName = (id: number | null | undefined) => (id ? allEmps.find((e) => e.id === id)?.name || `Emp #${id}` : 'Unassigned');

    const now = new Date();
    const isSameStation = existing.stationId === toStationId;
    const isSameDept = existing.departmentId === toDepartmentId;
    const actionType = !isSameStation
      ? 'StationChange'
      : !isSameDept
        ? 'DepartmentChange'
        : 'EmployeeReassignment';

    const fromSummary = `${regName(existing.regionId)} / ${staName(existing.stationId)} / ${deptName(existing.departmentId)} / ${empName(existing.assignedEmployeeId)}`;
    const toSummary = `${regName(toRegionId)} / ${staName(toStationId)} / ${deptName(toDepartmentId)} / ${empName(newEmployeeId ?? null)}`;

    const result = await db.transaction(async (tx) => {
      // 1. Insert completed Transfer record (no separate approval needed)
      const [inserted] = await tx.insert(assetTransfers).values({
        assetId,
        fromRegionId: existing.regionId,
        toRegionId,
        fromStationId: existing.stationId,
        toStationId,
        fromDepartmentId: existing.departmentId,
        toDepartmentId,
        previousEmployeeId: existing.assignedEmployeeId,
        newEmployeeId: newEmployeeId ?? null,
        reason,
        transferredByUserId: caller.sub,
        transferDate: now,
        status: 'Approved',
        approvedByUserId: caller.sub,
        approvalDate: now,
      });

      // 2. Immediately update Asset location & custodian
      await tx
        .update(assets)
        .set({
          regionId: toRegionId,
          stationId: toStationId,
          departmentId: toDepartmentId,
          assignedEmployeeId: newEmployeeId ?? null,
          updatedAt: now,
        })
        .where(eq(assets.assetId, assetId));

      // 3. Log detailed From -> To trail in assetHistory
      await tx.insert(assetHistory).values({
        assetId,
        actionType,
        description: `Transferred by ${caller.username} on ${now.toISOString()}: From [${fromSummary}] → To [${toSummary}]. Reason: ${reason}`,
        userId: caller.sub,
        createdAt: now,
      });

      // 4. Create Notification
      await tx.insert(notifications).values({
        type: 'AssetTransferred',
        message: `Asset ${existing.name} (${assetId}) transferred by ${caller.username}: From ${staName(existing.stationId)} (${deptName(existing.departmentId)}) → To ${staName(toStationId)} (${deptName(toDepartmentId)}).`,
        assetId,
      });

      return { transferId: inserted.insertId };
    });

    await logAudit('Transferred Asset', caller.sub, req, `${assetId}: From [${fromSummary}] -> To [${toSummary}]`);
    return NextResponse.json({ transferId: result.transferId, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Transfer asset error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
