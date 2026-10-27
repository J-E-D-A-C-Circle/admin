import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { regions, stations, departments, assetCategories, assetSubcategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

// POST: Add new lookup
export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin') {
      return forbiddenResponse('Only Super Admins can manage lookup lists');
    }

    const { type, payload } = await req.json();
    if (!type || !payload) {
      return NextResponse.json({ message: 'Type and payload are required' }, { status: 400 });
    }

    let result;
    if (type === 'regions') {
      if (!payload.name || !payload.code) {
        return NextResponse.json({ message: 'Name and Code are required' }, { status: 400 });
      }
      await db.insert(regions).values({ name: payload.name, code: payload.code });
      result = { message: 'Region created successfully' };
    } else if (type === 'stations') {
      if (!payload.name || !payload.regionId) {
        return NextResponse.json({ message: 'Name and Region are required' }, { status: 400 });
      }
      await db.insert(stations).values({ name: payload.name, regionId: parseInt(payload.regionId) });
      result = { message: 'Station created successfully' };
    } else if (type === 'departments') {
      if (!payload.name) {
        return NextResponse.json({ message: 'Name is required' }, { status: 400 });
      }
      await db.insert(departments).values({ name: payload.name });
      result = { message: 'Department created successfully' };
    } else if (type === 'categories') {
      if (!payload.name || !payload.code) {
        return NextResponse.json({ message: 'Name and Code are required' }, { status: 400 });
      }
      await db.insert(assetCategories).values({ name: payload.name, code: payload.code });
      result = { message: 'Category created successfully' };
    } else if (type === 'subcategories') {
      if (!payload.name || !payload.code || !payload.categoryId) {
        return NextResponse.json({ message: 'Name, Code, and Category are required' }, { status: 400 });
      }
      await db.insert(assetSubcategories).values({
        name: payload.name,
        code: payload.code,
        categoryId: parseInt(payload.categoryId),
      });
      result = { message: 'Subcategory created successfully' };
    } else {
      return NextResponse.json({ message: 'Invalid lookup type' }, { status: 400 });
    }

    await logAudit(`Created lookup entry in ${type}`, caller.sub, req, payload.name);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Create lookup error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

// PUT: Update existing lookup
export async function PUT(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin') {
      return forbiddenResponse('Only Super Admins can manage lookup lists');
    }

    const { type, id, payload } = await req.json();
    if (!type || !id || !payload) {
      return NextResponse.json({ message: 'Type, ID, and payload are required' }, { status: 400 });
    }

    let result;
    if (type === 'regions') {
      if (!payload.name || !payload.code) {
        return NextResponse.json({ message: 'Name and Code are required' }, { status: 400 });
      }
      await db.update(regions).set({ name: payload.name, code: payload.code }).where(eq(regions.id, id));
      result = { message: 'Region updated successfully' };
    } else if (type === 'stations') {
      if (!payload.name || !payload.regionId) {
        return NextResponse.json({ message: 'Name and Region are required' }, { status: 400 });
      }
      await db.update(stations).set({ name: payload.name, regionId: parseInt(payload.regionId) }).where(eq(stations.id, id));
      result = { message: 'Station updated successfully' };
    } else if (type === 'departments') {
      if (!payload.name) {
        return NextResponse.json({ message: 'Name is required' }, { status: 400 });
      }
      await db.update(departments).set({ name: payload.name }).where(eq(departments.id, id));
      result = { message: 'Department updated successfully' };
    } else if (type === 'categories') {
      if (!payload.name || !payload.code) {
        return NextResponse.json({ message: 'Name and Code are required' }, { status: 400 });
      }
      await db.update(assetCategories).set({ name: payload.name, code: payload.code }).where(eq(assetCategories.id, id));
      result = { message: 'Category updated successfully' };
    } else if (type === 'subcategories') {
      if (!payload.name || !payload.code || !payload.categoryId) {
        return NextResponse.json({ message: 'Name, Code, and Category are required' }, { status: 400 });
      }
      await db.update(assetSubcategories).set({
        name: payload.name,
        code: payload.code,
        categoryId: parseInt(payload.categoryId),
      }).where(eq(assetSubcategories.id, id));
      result = { message: 'Subcategory updated successfully' };
    } else {
      return NextResponse.json({ message: 'Invalid lookup type' }, { status: 400 });
    }

    await logAudit(`Updated lookup entry in ${type} (ID: ${id})`, caller.sub, req, payload.name);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Update lookup error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

// DELETE: Delete lookup
export async function DELETE(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin') {
      return forbiddenResponse('Only Super Admins can manage lookup lists');
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const idStr = searchParams.get('id');

    if (!type || !idStr) {
      return NextResponse.json({ message: 'Type and ID are required' }, { status: 400 });
    }

    const id = parseInt(idStr);

    if (type === 'regions') {
      await db.delete(regions).where(eq(regions.id, id));
    } else if (type === 'stations') {
      await db.delete(stations).where(eq(stations.id, id));
    } else if (type === 'departments') {
      await db.delete(departments).where(eq(departments.id, id));
    } else if (type === 'categories') {
      await db.delete(assetCategories).where(eq(assetCategories.id, id));
    } else if (type === 'subcategories') {
      await db.delete(assetSubcategories).where(eq(assetSubcategories.id, id));
    } else {
      return NextResponse.json({ message: 'Invalid lookup type' }, { status: 400 });
    }

    await logAudit(`Deleted lookup entry in ${type} (ID: ${id})`, caller.sub, req, String(id));
    return NextResponse.json({ success: true, message: 'Lookup entry deleted successfully' });
  } catch (err: any) {
    console.error('Delete lookup error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
