import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { employees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const updateEmployeeSchema = z.object({
  employeeId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  departmentId: z.number().int().positive().optional(),
  stationId: z.number().int().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Only Super Admins and Asset Officers can update employees');
    }

    const { id } = await context.params;
    const empRowId = Number.parseInt(id, 10);
    if (!Number.isFinite(empRowId) || empRowId <= 0) {
      return NextResponse.json({ message: 'Invalid employee ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const [existing] = await db.select().from(employees).where(eq(employees.id, empRowId)).limit(1);
    if (!existing) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }

    if (parsed.data.employeeId && parsed.data.employeeId !== existing.employeeId) {
      const [conflict] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.employeeId, parsed.data.employeeId))
        .limit(1);
      if (conflict) {
        return NextResponse.json({ message: 'Employee ID already exists' }, { status: 409 });
      }
    }

    await db.update(employees).set(parsed.data).where(eq(employees.id, empRowId));
    await logAudit(`Updated employee ${parsed.data.name || existing.name}`, caller.sub, req, parsed.data.employeeId || existing.employeeId);

    return NextResponse.json({ success: true, message: 'Employee updated successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Update employee error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Only Super Admins and Asset Officers can delete employees');
    }

    const { id } = await context.params;
    const empRowId = Number.parseInt(id, 10);
    if (!Number.isFinite(empRowId) || empRowId <= 0) {
      return NextResponse.json({ message: 'Invalid employee ID' }, { status: 400 });
    }

    const [existing] = await db.select().from(employees).where(eq(employees.id, empRowId)).limit(1);
    if (!existing) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }

    await db.delete(employees).where(eq(employees.id, empRowId));
    await logAudit(`Deleted employee ${existing.name}`, caller.sub, req, existing.employeeId);

    return NextResponse.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err: unknown) {
    const dbErr = err as { code?: string; errno?: number; message?: string };
    console.error('Delete employee error:', err);
    if (dbErr?.code === 'ER_ROW_IS_REFERENCED_2' || dbErr?.errno === 1451) {
      return NextResponse.json(
        { message: 'Cannot delete this employee because existing assets or transfer records reference them.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: 'Internal Server Error', error: dbErr?.message || 'Unknown error' }, { status: 500 });
  }
}

