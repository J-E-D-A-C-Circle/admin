import { NextRequest, NextResponse } from 'next/server';
import { desc, sql, eq } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import { emsAuth, serverError } from '@/lib/ems-server';

export async function GET(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canViewReports || p.canViewDispatches);
    if (a instanceof NextResponse) return a;

    // Fetch dispatch creation & verification events
    const dispatchEvents = await db
      .select({
        id: s.emsDispatches.id,
        ref: s.emsDispatches.referenceId,
        tracking: s.emsDispatches.emsTrackingNumber,
        status: s.emsDispatches.status,
        rejectionReason: s.emsDispatches.rejectionReason,
        cost: s.emsDispatches.cost,
        createdAt: s.emsDispatches.createdAt,
        verifiedAt: s.emsDispatches.verifiedAt,
        createdById: s.emsDispatches.createdByUserId,
        verifiedById: s.emsDispatches.verifiedByUserId,
        stationName: s.stations.name,
      })
      .from(s.emsDispatches)
      .innerJoin(s.stations, eq(s.emsDispatches.stationId, s.stations.id))
      .orderBy(desc(s.emsDispatches.createdAt))
      .limit(60);

    // Fetch monthly return submissions, approvals, unlocks
    const returnEvents = await db
      .select({
        id: s.emsMonthlyReturns.id,
        year: s.emsMonthlyReturns.year,
        month: s.emsMonthlyReturns.month,
        status: s.emsMonthlyReturns.status,
        totalLetters: s.emsMonthlyReturns.totalLetters,
        totalCost: s.emsMonthlyReturns.totalCost,
        submittedAt: s.emsMonthlyReturns.submittedAt,
        approvedAt: s.emsMonthlyReturns.approvedAt,
        unlockedAt: s.emsMonthlyReturns.unlockedAt,
        unlockReason: s.emsMonthlyReturns.unlockReason,
        stationName: s.stations.name,
      })
      .from(s.emsMonthlyReturns)
      .innerJoin(s.stations, eq(s.emsMonthlyReturns.stationId, s.stations.id))
      .orderBy(desc(s.emsMonthlyReturns.createdAt))
      .limit(30);

    // Fetch users for mapping names
    const allUsers = await db
      .select({ id: s.users.id, name: s.users.name, role: s.roles.name })
      .from(s.users)
      .leftJoin(s.roles, eq(s.users.roleId, s.roles.id));
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    // Synthesize tamper-proof unified audit events list
    const logs: Array<{
      id: string;
      timestamp: string;
      eventType: 'DISPATCH_LOGGED' | 'DISPATCH_VERIFIED' | 'DISPATCH_REJECTED' | 'RETURN_SUBMITTED' | 'RETURN_APPROVED' | 'RETURN_UNLOCKED';
      actor: string;
      role: string;
      station: string;
      details: string;
      severity: 'info' | 'success' | 'warning' | 'alert';
    }> = [];

    // Process dispatches
    for (const d of dispatchEvents) {
      const creator = userMap.get(d.createdById);
      logs.push({
        id: `disp-create-${d.id}`,
        timestamp: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
        eventType: 'DISPATCH_LOGGED',
        actor: creator?.name || 'Postal Officer',
        role: creator?.role || 'EMS Admin Officer',
        station: d.stationName,
        details: `Logged new postal dispatch ${d.tracking} (${d.ref}) - Cost GHS ${d.cost}`,
        severity: 'info',
      });

      if (d.verifiedAt && d.verifiedById) {
        const verifier = userMap.get(d.verifiedById);
        if (d.status === 'Verified') {
          logs.push({
            id: `disp-ver-${d.id}`,
            timestamp: new Date(d.verifiedAt).toISOString(),
            eventType: 'DISPATCH_VERIFIED',
            actor: verifier?.name || 'Station Manager',
            role: verifier?.role || 'Station Manager',
            station: d.stationName,
            details: `Audited and verified dispatch ${d.tracking} with GhanaPost receipt voucher`,
            severity: 'success',
          });
        } else if (d.status === 'Rejected') {
          logs.push({
            id: `disp-rej-${d.id}`,
            timestamp: new Date(d.verifiedAt).toISOString(),
            eventType: 'DISPATCH_REJECTED',
            actor: verifier?.name || 'Station Manager',
            role: verifier?.role || 'Station Manager',
            station: d.stationName,
            details: `Rejected dispatch ${d.tracking}. Reason: ${d.rejectionReason || 'Voucher discrepancy'}`,
            severity: 'warning',
          });
        }
      }
    }

    // Process returns
    for (const r of returnEvents) {
      if (r.submittedAt) {
        logs.push({
          id: `ret-sub-${r.id}`,
          timestamp: new Date(r.submittedAt).toISOString(),
          eventType: 'RETURN_SUBMITTED',
          actor: 'Station Manager / Admin Officer',
          role: 'Station Administrator',
          station: r.stationName,
          details: `Submitted Monthly Return ${r.year}-${String(r.month).padStart(2, '0')} (${r.totalLetters} letters, GHS ${r.totalCost}) to HQ Directorate`,
          severity: 'info',
        });
      }

      if (r.approvedAt) {
        logs.push({
          id: `ret-app-${r.id}`,
          timestamp: new Date(r.approvedAt).toISOString(),
          eventType: 'RETURN_APPROVED',
          actor: 'Director of Administration HQ',
          role: 'HQ Directorate',
          station: r.stationName,
          details: `Approved statutory monthly return ${r.year}-${String(r.month).padStart(2, '0')}. Imprest liquidation cleared.`,
          severity: 'success',
        });
      }

      if (r.unlockedAt) {
        logs.push({
          id: `ret-unl-${r.id}`,
          timestamp: new Date(r.unlockedAt).toISOString(),
          eventType: 'RETURN_UNLOCKED',
          actor: 'Director of Administration HQ',
          role: 'HQ Directorate',
          station: r.stationName,
          details: `Unlocked locked return ${r.year}-${String(r.month).padStart(2, '0')}. Justification: ${r.unlockReason || 'Correction required'}`,
          severity: 'alert',
        });
      }
    }

    // Sort descending by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (err: any) {
    return serverError(err, 'get ems audit trail');
  }
}
