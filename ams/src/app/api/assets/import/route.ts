import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, assetHistory, auditLogs } from '@/db/schema';
import { verifyAuth } from '@/lib/auth-helper';
import { eq, inArray } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'Super_Admin' && user.role !== 'National_Admin') {
      return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Invalid or empty items list' }, { status: 400 });
    }

    // Load all lookup tables for name-to-id resolution
    const [categories, subcategories, regions, stations, departments, employees] = await Promise.all([
      db.query.assetCategories.findMany(),
      db.query.assetSubcategories.findMany(),
      db.query.regions.findMany(),
      db.query.stations.findMany(),
      db.query.departments.findMany(),
      db.query.employees.findMany(),
    ]);

    // Create lookup maps
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const subcategoryMap = new Map(subcategories.map((s) => [`${s.categoryId}-${s.name.toLowerCase()}`, s.id]));
    const regionMap = new Map(regions.map((r) => [r.name.toLowerCase(), r.id]));
    const stationMap = new Map(stations.map((s) => [`${s.regionId}-${s.name.toLowerCase()}`, s.id]));
    const departmentMap = new Map(departments.map((d) => [d.name.toLowerCase(), d.id]));
    const employeeMap = new Map(employees.map((e) => [e.employeeId.toLowerCase(), e.id]));

    const errors: string[] = [];
    const validAssets: any[] = [];

    // Pre-fetch existing serial numbers and asset IDs to check for duplicates
    const serialNumbersToCheck = items.map((item) => item.serialNumber).filter(Boolean);
    const assetIdsToCheck = items.map((item) => item.assetId).filter(Boolean);

    const existingAssets = (serialNumbersToCheck.length > 0 || assetIdsToCheck.length > 0)
      ? await db.select().from(assets).where(
          inArray(assets.serialNumber, serialNumbersToCheck)
        )
      : [];

    const existingSerials = new Set(existingAssets.map((a) => a.serialNumber.toLowerCase()));
    const existingIds = new Set(existingAssets.map((a) => a.assetId.toLowerCase()));

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const rowNum = i + 1;

      if (!row.name) {
        errors.push(`Row ${rowNum}: Name is required`);
        continue;
      }
      if (!row.serialNumber) {
        errors.push(`Row ${rowNum}: Serial Number is required`);
        continue;
      }
      if (!row.category) {
        errors.push(`Row ${rowNum}: Category is required`);
        continue;
      }
      if (!row.subcategory) {
        errors.push(`Row ${rowNum}: Subcategory is required`);
        continue;
      }
      if (!row.region) {
        errors.push(`Row ${rowNum}: Region is required`);
        continue;
      }
      if (!row.station) {
        errors.push(`Row ${rowNum}: Station is required`);
        continue;
      }
      if (!row.department) {
        errors.push(`Row ${rowNum}: Department is required`);
        continue;
      }

      // Check duplicates in database
      if (existingSerials.has(row.serialNumber.toLowerCase())) {
        errors.push(`Row ${rowNum}: Serial number "${row.serialNumber}" already exists in database`);
        continue;
      }
      if (row.assetId && existingIds.has(row.assetId.toLowerCase())) {
        errors.push(`Row ${rowNum}: Asset ID "${row.assetId}" already exists in database`);
        continue;
      }

      // Resolve IDs
      const catId = categoryMap.get(row.category.toLowerCase());
      if (!catId) {
        errors.push(`Row ${rowNum}: Category "${row.category}" not found`);
        continue;
      }

      const subcatId = subcategoryMap.get(`${catId}-${row.subcategory.toLowerCase()}`);
      if (!subcatId) {
        errors.push(`Row ${rowNum}: Subcategory "${row.subcategory}" not found for category "${row.category}"`);
        continue;
      }

      const regId = regionMap.get(row.region.toLowerCase());
      if (!regId) {
        errors.push(`Row ${rowNum}: Region "${row.region}" not found`);
        continue;
      }

      const statId = stationMap.get(`${regId}-${row.station.toLowerCase()}`);
      if (!statId) {
        errors.push(`Row ${rowNum}: Station "${row.station}" not found in region "${row.region}"`);
        continue;
      }

      const deptId = departmentMap.get(row.department.toLowerCase());
      if (!deptId) {
        errors.push(`Row ${rowNum}: Department "${row.department}" not found`);
        continue;
      }

      let empId: number | null = null;
      if (row.assignedEmployeeId) {
        const emp = employeeMap.get(row.assignedEmployeeId.toLowerCase());
        if (!emp) {
          errors.push(`Row ${rowNum}: Employee ID "${row.assignedEmployeeId}" not found`);
          continue;
        }
        empId = emp;
      }

      // Handle acquisition date
      let acqDate = new Date();
      if (row.acquisitionDate) {
        const parsed = new Date(row.acquisitionDate);
        if (!isNaN(parsed.getTime())) {
          acqDate = parsed;
        }
      }

      // Determine asset ID (if not provided, we will generate it later)
      const assetId = row.assetId || `DVLA-${row.category.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      validAssets.push({
        assetId,
        name: row.name,
        categoryId: catId,
        subcategoryId: subcatId,
        brand: row.brand || null,
        model: row.model || null,
        serialNumber: row.serialNumber,
        licensePlate: row.licensePlate || null,
        engineNumber: row.engineNumber || null,
        description: row.description || null,
        regionId: regId,
        stationId: statId,
        departmentId: deptId,
        assignedEmployeeId: empId,
        status: row.status || 'Active',
        acquisitionDate: acqDate,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 422 });
    }

    // Insert all assets in a transaction
    await db.transaction(async (tx) => {
      for (const asset of validAssets) {
        await tx.insert(assets).values(asset);

        // Record history
        await tx.insert(assetHistory).values({
          assetId: asset.assetId,
          actionType: 'Created',
          description: 'Asset created via bulk import',
          userId: user.sub,
        });
      }

      // Create single audit log entry for bulk import
      await tx.insert(auditLogs).values({
        action: 'Bulk Asset Import',
        userId: user.sub,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        affectedRecord: `Imported ${validAssets.length} assets`,
      });
    });

    return NextResponse.json({
      message: `Successfully imported ${validAssets.length} assets.`,
      count: validAssets.length,
    });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
