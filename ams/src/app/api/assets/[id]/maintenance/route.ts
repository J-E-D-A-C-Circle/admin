import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assets, maintenanceSchedules, assetHistory, auditLogs, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-helper';

const createMaintenanceSchema = z.object({
  serviceType: z.enum(['Routine', 'Major', 'Emergency']),
  serviceDate: z.string(),
  nextServiceDueDate: z.string().optional().nullable(),
  odometerReading: z.number().int().positive().optional().nullable(),
  serviceNotes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();

    const { id: assetId } = await params;

    // Verify asset exists
    const [asset] = await db.select().from(assets).where(eq(assets.assetId, assetId)).limit(1);
    if (!asset) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    const records = await db
      .select({
        id: maintenanceSchedules.id,
        serviceType: maintenanceSchedules.serviceType,
        serviceDate: maintenanceSchedules.serviceDate,
        nextServiceDueDate: maintenanceSchedules.nextServiceDueDate,
        odometerReading: maintenanceSchedules.odometerReading,
        serviceNotes: maintenanceSchedules.serviceNotes,
        createdAt: maintenanceSchedules.createdAt,
        recorderName: users.name,
      })
      .from(maintenanceSchedules)
      .leftJoin(users, eq(maintenanceSchedules.recordedByUserId, users.id))
      .where(eq(maintenanceSchedules.assetId, assetId))
      .orderBy(desc(maintenanceSchedules.serviceDate));

    return NextResponse.json(records);
  } catch (err: any) {
    console.error('Fetch maintenance logs error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = verifyAuth(req);
    if (!caller) return unauthorizedResponse();
    if (caller.role !== 'Super Admin' && caller.role !== 'Asset Officer') {
      return forbiddenResponse('Permission denied to log maintenance');
    }

    const { id: assetId } = await params;
    const body = await req.json();
    const parsed = createMaintenanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.errors }, { status: 400 });
    }

    // Verify asset exists
    const [asset] = await db.select().from(assets).where(eq(assets.assetId, assetId)).limit(1);
    if (!asset) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    const { serviceType, serviceDate, nextServiceDueDate, odometerReading, serviceNotes } = parsed.data;

    await db.transaction(async (tx) => {
      // Insert maintenance schedule
      await tx.insert(maintenanceSchedules).values({
        assetId,
        serviceType,
        serviceDate: new Date(serviceDate),
        nextServiceDueDate: nextServiceDueDate ? new Date(nextServiceDueDate) : null,
        odometerReading: odometerReading || null,
        serviceNotes: serviceNotes || null,
        recordedByUserId: caller.sub,
      });

      // Update asset status to Under_Maintenance if it isn't already (and isn't obsolete)
      if (asset.status !== 'Obsolete' && asset.status !== 'Under_Maintenance') {
        await tx.update(assets).set({ status: 'Under_Maintenance', updatedAt: new Date() }).where(eq(assets.assetId, assetId));
      }

      // Log asset history
      await tx.insert(assetHistory).values({
        assetId,
        actionType: 'MaintenanceLogged',
        description: `Logged ${serviceType} maintenance service. Notes: ${serviceNotes || 'None'}. Odometer: ${odometerReading || 'N/A'} km.`.trim(),
        userId: caller.sub,
      });

      // Log audit
      await tx.insert(auditLogs).values({
        action: 'Logged Maintenance',
        userId: caller.sub,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        affectedRecord: assetId,
      });
    });

    return NextResponse.json({ success: true, message: 'Maintenance logged successfully.' });
  } catch (err: any) {
    console.error('Log maintenance error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
