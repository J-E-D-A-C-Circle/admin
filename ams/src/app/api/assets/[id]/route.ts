import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, assetCategories, assetSubcategories, regions, stations, departments, employees, assetHistory, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, getScopeWhere, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const updateAssetSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().min(1),
  licensePlate: z.string().optional().nullable(),
  engineNumber: z.string().optional().nullable(),
  purchaseValue: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['Active', 'Under_Maintenance', 'Damaged', 'Missing', 'Disposed']),
  assignedEmployeeId: z.number().int().positive().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { id: assetId } = await params;

    // Scoping check
    const scope = getScopeWhere(caller);

    const conditions = [eq(assets.assetId, assetId)];
    if (scope.regionId) conditions.push(eq(assets.regionId, scope.regionId));
    if (scope.stationId) conditions.push(eq(assets.stationId, scope.stationId));

    const rows = await db
      .select({
        assetId: assets.assetId,
        name: assets.name,
        brand: assets.brand,
        model: assets.model,
        serialNumber: assets.serialNumber,
        licensePlate: assets.licensePlate,
        engineNumber: assets.engineNumber,
        purchaseValue: assets.purchaseValue,
        status: assets.status,
        acquisitionDate: assets.acquisitionDate,
        createdAt: assets.createdAt,
        lastVerificationDate: assets.lastVerificationDate,
        description: assets.description,
        categoryId: assets.categoryId,
        categoryName: assetCategories.name,
        subcategoryId: assets.subcategoryId,
        subcategoryName: assetSubcategories.name,
        regionId: assets.regionId,
        regionName: regions.name,
        stationId: assets.stationId,
        stationName: stations.name,
        departmentId: assets.departmentId,
        departmentName: departments.name,
        assignedEmployeeId: assets.assignedEmployeeId,
        assignedEmployeeName: employees.name,
        assignedEmployeeIdCode: employees.employeeId,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(assetSubcategories, eq(assets.subcategoryId, assetSubcategories.id))
      .leftJoin(regions, eq(assets.regionId, regions.id))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(departments, eq(assets.departmentId, departments.id))
      .leftJoin(employees, eq(assets.assignedEmployeeId, employees.id))
      .where(and(...conditions))
      .limit(1);

    const asset = rows[0];
    if (!asset) {
      return NextResponse.json({ message: 'Asset not found or access restricted' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (err: any) {
    console.error('Fetch asset details error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer' && caller.role !== 'Station Manager') {
      return forbiddenResponse('Permission denied to update assets');
    }

    const { id: assetId } = await params;
    const body = await req.json();
    const parsed = updateAssetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { status, assignedEmployeeId, ...rest } = parsed.data;

    // Fetch existing asset
    const [existing] = await db.select().from(assets).where(eq(assets.assetId, assetId)).limit(1);
    if (!existing) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    // Role-based verification
    if (caller.role === 'Station Manager' && existing.stationId !== caller.stationId) {
      return forbiddenResponse('Station Managers can only update assets within their station');
    }

    const updated = await db.transaction(async (tx) => {
      // Update Asset details
      await tx
        .update(assets)
        .set({
          ...rest,
          status,
          assignedEmployeeId: assignedEmployeeId ?? null,
        })
        .where(eq(assets.assetId, assetId));

      const changes: string[] = [];

      // Status Change
      if (existing.status !== status) {
        changes.push(`Status updated from '${existing.status}' to '${status}'`);

        if (status === 'Missing' || status === 'Damaged') {
          await tx.insert(notifications).values({
            type: status === 'Missing' ? 'AssetMissing' : 'AssetUpdated',
            message: `Asset ${rest.name} (${assetId}) marked as ${status}`,
            assetId,
          });
        }
      }

      // Employee Reassignment Change
      if (existing.assignedEmployeeId !== (assignedEmployeeId ?? null)) {
        let oldName = 'Unassigned';
        let newName = 'Unassigned';

        if (existing.assignedEmployeeId) {
          const [emp] = await tx.select().from(employees).where(eq(employees.id, existing.assignedEmployeeId)).limit(1);
          if (emp) oldName = emp.name;
        }
        if (assignedEmployeeId) {
          const [emp] = await tx.select().from(employees).where(eq(employees.id, assignedEmployeeId)).limit(1);
          if (emp) newName = emp.name;
        }

        changes.push(`Assigned Employee updated from '${oldName}' to '${newName}'`);
      }

      // Name Change
      if (existing.name !== rest.name) {
        changes.push(`Name updated from '${existing.name}' to '${rest.name}'`);
      }

      // Brand Change
      if ((existing.brand || '') !== (rest.brand || '')) {
        changes.push(`Brand updated from '${existing.brand || 'N/A'}' to '${rest.brand || 'N/A'}'`);
      }

      // Model Change
      if ((existing.model || '') !== (rest.model || '')) {
        changes.push(`Model updated from '${existing.model || 'N/A'}' to '${rest.model || 'N/A'}'`);
      }

      // Serial Number Change
      if (existing.serialNumber !== rest.serialNumber) {
        changes.push(`Serial Number updated from '${existing.serialNumber}' to '${rest.serialNumber}'`);
      }

      // License Plate Change
      if ((existing.licensePlate || '') !== (rest.licensePlate || '')) {
        changes.push(`License Plate updated from '${existing.licensePlate || 'N/A'}' to '${rest.licensePlate || 'N/A'}'`);
      }

      // Engine Number Change
      if ((existing.engineNumber || '') !== (rest.engineNumber || '')) {
        changes.push(`Engine Number updated from '${existing.engineNumber || 'N/A'}' to '${rest.engineNumber || 'N/A'}'`);
      }

      // Purchase Value Change
      if ((existing.purchaseValue || '') !== (rest.purchaseValue || '')) {
        changes.push(`Purchase Value updated from '${existing.purchaseValue || 'N/A'}' to '${rest.purchaseValue || 'N/A'}'`);
      }

      // Description Change
      if ((existing.description || '') !== (rest.description || '')) {
        changes.push(`Description updated from '${existing.description || 'N/A'}' to '${rest.description || 'N/A'}'`);
      }

      if (changes.length > 0) {
        const isOnlyStatus = changes.length === 1 && changes[0].startsWith('Status updated');
        const actionType = isOnlyStatus ? ('StatusChange' as const) : ('Updated' as const);

        await tx.insert(assetHistory).values({
          assetId,
          actionType,
          description: changes.join('; '),
          userId: caller.sub,
        });
      } else {
        // Fallback: If no specific fields changed but update was triggered
        await tx.insert(assetHistory).values({
          assetId,
          actionType: 'Updated' as const,
          description: 'Asset details updated',
          userId: caller.sub,
        });
      }

      return { assetId };
    });

    await logAudit('Updated Asset', caller.sub, req, assetId);
    return NextResponse.json({ assetId: updated.assetId, success: true });
  } catch (err: any) {
    console.error('Update asset error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin') {
      return forbiddenResponse('Only Super Admins can delete assets');
    }

    const { id: assetId } = await params;

    // Fetch existing asset
    const [existing] = await db.select().from(assets).where(eq(assets.assetId, assetId)).limit(1);
    if (!existing) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    // Delete asset
    await db.delete(assets).where(eq(assets.assetId, assetId));

    // Log audit
    await logAudit('Deleted Asset', caller.sub, req, assetId);

    return NextResponse.json({ success: true, message: `Asset ${assetId} deleted successfully` });
  } catch (err: any) {
    console.error('Delete asset error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

