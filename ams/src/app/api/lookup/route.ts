import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { regions, stations, departments, employees, assetCategories, assetSubcategories, roles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';
import { ensureSchema } from '@/lib/ensureSchema';

export async function GET(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    await ensureSchema();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const regionId = searchParams.get('regionId');
    const stationId = searchParams.get('stationId');
    const categoryId = searchParams.get('categoryId');

    // If a specific lookup type is requested, return only that type
    if (type === 'regions') {
      const data = await db.select().from(regions).orderBy(regions.name);
      return NextResponse.json(data);
    }
    if (type === 'stations') {
      const query = db
        .select({
          id: stations.id,
          name: stations.name,
          regionId: stations.regionId,
          regionName: regions.name,
          code: stations.code,
          city: stations.city,
          latitude: stations.latitude,
          longitude: stations.longitude,
          address: stations.address,
          phone: stations.phone,
        })
        .from(stations)
        .leftJoin(regions, eq(stations.regionId, regions.id));

      if (regionId) {
        query.where(eq(stations.regionId, parseInt(regionId)));
      }
      const data = await query.orderBy(stations.name);
      return NextResponse.json(data);
    }
    if (type === 'departments') {
      const data = await db.select().from(departments).orderBy(departments.name);
      return NextResponse.json(data);
    }
    if (type === 'employees') {
      const query = db.select().from(employees);
      if (stationId) {
        query.where(eq(employees.stationId, parseInt(stationId)));
      }
      const data = await query.orderBy(employees.name);
      return NextResponse.json(data);
    }
    if (type === 'categories') {
      const data = await db.select().from(assetCategories).orderBy(assetCategories.name);
      return NextResponse.json(data);
    }
    if (type === 'subcategories') {
      const query = db.select().from(assetSubcategories);
      if (categoryId) {
        query.where(eq(assetSubcategories.categoryId, parseInt(categoryId)));
      }
      const data = await query.orderBy(assetSubcategories.name);
      return NextResponse.json(data);
    }
    if (type === 'roles') {
      const data = await db.select().from(roles).orderBy(roles.name);
      return NextResponse.json(data);
    }

    // Default: return all lookup tables in a single payload to minimize roundtrips
    const [
      allRegions,
      allStations,
      allDepts,
      allCategories,
      allSubcategories,
      allEmployees,
      allRoles,
    ] = await Promise.all([
      db.select().from(regions).orderBy(regions.name),
      db
        .select({
          id: stations.id,
          name: stations.name,
          regionId: stations.regionId,
          regionName: regions.name,
          code: stations.code,
          city: stations.city,
          latitude: stations.latitude,
          longitude: stations.longitude,
          address: stations.address,
          phone: stations.phone,
        })
        .from(stations)
        .leftJoin(regions, eq(stations.regionId, regions.id))
        .orderBy(stations.name),
      db.select().from(departments).orderBy(departments.name),
      db.select().from(assetCategories).orderBy(assetCategories.name),
      db.select().from(assetSubcategories).orderBy(assetSubcategories.name),
      db.select().from(employees).orderBy(employees.name),
      db.select().from(roles).orderBy(roles.name),
    ]);

    return NextResponse.json({
      regions: allRegions,
      stations: allStations,
      departments: allDepts,
      categories: allCategories,
      subcategories: allSubcategories,
      employees: allEmployees,
      roles: allRoles,
    });
  } catch (err: any) {
    console.error('Lookup fetch error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
