import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees, departments, stations, assets, assetCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';
import { ensureSchema } from '@/lib/ensureSchema';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { id } = await params;
    const empRowId = Number.parseInt(id, 10);
    if (!Number.isFinite(empRowId) || empRowId <= 0) {
      return NextResponse.json({ message: 'Invalid employee ID' }, { status: 400 });
    }

    const [employee] = await db
      .select({
        id: employees.id,
        employeeId: employees.employeeId,
        name: employees.name,
        position: employees.position,
        departmentName: departments.name,
        stationName: stations.name,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(stations, eq(employees.stationId, stations.id))
      .where(eq(employees.id, empRowId))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }

    const heldAssets = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        serialNumber: assets.serialNumber,
        categoryName: assetCategories.name,
        stationName: stations.name,
        subLocation: assets.subLocation,
        status: assets.status,
        purchaseValue: assets.purchaseValue,
        acquisitionDate: assets.acquisitionDate,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .where(eq(assets.assignedEmployeeId, empRowId));

    const activeCount = heldAssets.filter((a) => a.status !== 'Obsolete').length;
    const totalValue = heldAssets.reduce((sum, a) => sum + (parseFloat(a.purchaseValue || '0') || 0), 0);

    return NextResponse.json({
      employee,
      clearanceStatus: activeCount === 0 ? 'Cleared' : 'Pending Return',
      activeCount,
      totalValue: totalValue.toFixed(2),
      assets: heldAssets,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fetch employee custody error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
