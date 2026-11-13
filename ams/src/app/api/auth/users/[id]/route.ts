import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';
import { logAudit } from '@/lib/audit-helper';

const updateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  roleId: z.number().int().positive().optional(),
  regionId: z.number().int().positive().nullable().optional(),
  stationId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin') {
      return forbiddenResponse('Only Super Admin can update users or reset passwords');
    }

    const { id } = await context.params;
    const targetId = Number.parseInt(id, 10);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0]?.message || 'Validation failed', errors: parsed.error.errors },
        { status: 400 }
      );
    }

    const [existing] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
    if (!existing) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const updateFields: Record<string, any> = {};
    if (parsed.data.username !== undefined && parsed.data.username !== existing.username) {
      const [conflict] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, parsed.data.username))
        .limit(1);
      if (conflict) {
        return NextResponse.json({ message: 'Username is already taken' }, { status: 409 });
      }
      updateFields.username = parsed.data.username;
    }
    if (parsed.data.password) {
      updateFields.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    }
    if (parsed.data.name !== undefined) updateFields.name = parsed.data.name;
    if (parsed.data.email !== undefined) updateFields.email = parsed.data.email;
    if (parsed.data.roleId !== undefined) updateFields.roleId = parsed.data.roleId;
    if (parsed.data.regionId !== undefined) updateFields.regionId = parsed.data.regionId;
    if (parsed.data.stationId !== undefined) updateFields.stationId = parsed.data.stationId;
    if (parsed.data.isActive !== undefined) {
      if (caller.sub === targetId && parsed.data.isActive === false) {
        return NextResponse.json({ message: 'You cannot disable your own account' }, { status: 400 });
      }
      updateFields.isActive = parsed.data.isActive;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ message: 'No fields provided to update' }, { status: 400 });
    }

    await db.update(users).set(updateFields).where(eq(users.id, targetId));

    await logAudit(
      parsed.data.password ? 'Admin Password Reset' : 'User Updated',
      caller.sub,
      req,
      existing.username
    );

    return NextResponse.json({
      success: true,
      message: parsed.data.password
        ? `Password reset successfully for ${existing.username}`
        : `User ${existing.username} updated successfully`,
    });
  } catch (err: any) {
    console.error('Update user error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin') {
      return forbiddenResponse('Only Super Admin can delete users');
    }

    const { id } = await context.params;
    const targetId = Number.parseInt(id, 10);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    if (caller.sub === targetId) {
      return NextResponse.json({ message: 'You cannot delete your own account' }, { status: 400 });
    }

    const [existing] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
    if (!existing) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    await db.delete(users).where(eq(users.id, targetId));

    await logAudit(
      'User Deleted',
      caller.sub,
      req,
      existing.username
    );

    return NextResponse.json({ success: true, message: `User ${existing.username} deleted` });
  } catch (err: any) {
    console.error('Delete user error:', err);
    if (err?.code === 'ER_ROW_IS_REFERENCED_2' || err?.errno === 1451) {
      return NextResponse.json(
        { message: 'Cannot delete user because audit logs, transfers, or history reference this account. Disable the account instead.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

