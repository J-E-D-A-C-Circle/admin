import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, assetCategories, assetSubcategories, regions, stations, departments, employees, assetHistory, notifications } from '@/db/schema';
import { eq, and, or, like, sql, count as countFn, inArray } from 'drizzle-orm';
import { verifyAuth, getScopeWhere, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const createAssetSchema = z.object({
  name: z.string().min(1),
  categoryId: z.number().int().positive(),
  subcategoryId: z.number().int().positive(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().min(1),
  licensePlate: z.string().optional().nullable(),
  engineNumber: z.string().optional().nullable(),
  purchaseValue: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  regionId: z.number().int().positive(),
  stationId: z.number().int().positive(),
  departmentId: z.number().int().positive(),
  assignedEmployeeId: z.number().int().positive().optional().nullable(),
  acquisitionDate: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status') as any;
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');
    const regionId = searchParams.get('regionId');
    const stationId = searchParams.get('stationId');
    const departmentId = searchParams.get('departmentId');
    const ids = searchParams.get('ids');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Apply role-based visibility scoping
    const scope = getScopeWhere(caller);

    const conditions = [];

    // Apply scopes
    if (scope.regionId) conditions.push(eq(assets.regionId, scope.regionId));
    if (scope.stationId) conditions.push(eq(assets.stationId, scope.stationId));

    // Apply user filters
    if (ids) {
      const idList = ids.split(',').filter(Boolean);
      if (idList.length > 0) {
        conditions.push(inArray(assets.assetId, idList));
      }
    }
    if (status) conditions.push(eq(assets.status, status));
    if (categoryId) conditions.push(eq(assets.categoryId, parseInt(categoryId)));
    if (subcategoryId) conditions.push(eq(assets.subcategoryId, parseInt(subcategoryId)));
    if (regionId && !scope.regionId) conditions.push(eq(assets.regionId, parseInt(regionId)));
    if (stationId && !scope.stationId) conditions.push(eq(assets.stationId, parseInt(stationId)));
    if (departmentId) conditions.push(eq(assets.departmentId, parseInt(departmentId)));

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(assets.assetId, term),
          like(assets.name, term),
          like(assets.serialNumber, term),
          like(assets.licensePlate, term),
          like(assets.engineNumber, term),
          like(employees.name, term),
          like(stations.name, term),
          like(regions.name, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Select query
    const dataQuery = db
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
      .where(whereClause)
      .orderBy(sql`${assets.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Count query
    const countQuery = db
      .select({ value: countFn() })
      .from(assets)
      .leftJoin(regions, eq(assets.regionId, regions.id))
      .leftJoin(stations, eq(assets.stationId, stations.id))
      .leftJoin(employees, eq(assets.assignedEmployeeId, employees.id))
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
    console.error('Fetch assets error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Only Super Admins and Asset Officers can register new assets');
    }

    const body = await req.json();
    const parsed = createAssetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { categoryId, acquisitionDate, ...rest } = parsed.data;

    // Fetch category to get category code
    const [cat] = await db.select().from(assetCategories).where(eq(assetCategories.id, categoryId)).limit(1);
    if (!cat) {
      return NextResponse.json({ message: 'Invalid category selected' }, { status: 400 });
    }

    // Generate Asset ID: count existing assets in this category
    const [countResult] = await db
      .select({ value: countFn() })
      .from(assets)
      .where(eq(assets.categoryId, categoryId));
    const catCount = countResult?.value || 0;
    const assetId = `DVLA-${cat.code}-${String(catCount + 1).padStart(6, '0')}`;

    try {
      const result = await db.transaction(async (tx) => {
        // Insert Asset
        const rawPv = rest.purchaseValue != null ? String(rest.purchaseValue).trim() : '';
        const normalizedPurchaseValue =
          rawPv !== '' && Number.isFinite(Number(rawPv)) ? Number(rawPv).toFixed(2) : null;

        await tx.insert(assets).values({
          assetId,
          categoryId,
          acquisitionDate: new Date(acquisitionDate),
          ...rest,
          purchaseValue: normalizedPurchaseValue,
          assignedEmployeeId: rest.assignedEmployeeId ?? null,
          status: 'Active',
        });

        // Insert History
        await tx.insert(assetHistory).values({
          assetId,
          actionType: 'Created',
          description: 'Asset registered in the system',
          userId: caller.sub,
        });

        // Insert Notification
        await tx.insert(notifications).values({
          type: 'NewAsset',
          message: `New asset ${rest.name} (${assetId}) registered`,
          assetId,
        });

        return { assetId };
      });

      await logAudit('Registered Asset', caller.sub, req, assetId);
      return NextResponse.json({ assetId, success: true }, { status: 201 });
    } catch (dbErr: any) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ message: 'Asset serial number already exists' }, { status: 409 });
      }
      throw dbErr;
    }
  } catch (err: any) {
    console.error('Create asset error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
