import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { employees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const createEmployeeSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  position: z.string().min(1),
  departmentId: z.number().int().positive(),
  stationId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Only Super Admins and Asset Officers can manage employees');
    }

    const body = await req.json();
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    const { employeeId, name, position, departmentId, stationId } = parsed.data;

    // Check if employeeId already exists
    const [existing] = await db.select().from(employees).where(eq(employees.employeeId, employeeId)).limit(1);
    if (existing) {
      return NextResponse.json({ message: 'Employee ID already exists' }, { status: 409 });
    }

    await db.insert(employees).values({
      employeeId,
      name,
      position,
      departmentId,
      stationId,
    });

    await logAudit(`Created employee ${name}`, caller.sub, req, employeeId);
    return NextResponse.json({ success: true, message: 'Employee created successfully' }, { status: 201 });
  } catch (err: any) {
    console.error('Create employee error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
