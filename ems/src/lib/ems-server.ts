// Server-only helpers for the EMS module (auth/scoping, notifications, locks, compliance, reference IDs).
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, lt, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import * as s from '@/db/schema';
import { verifyAuth, unauthorizedResponse, forbiddenResponse, type JwtPayload } from '@/lib/auth-helper';
import {
  emsPerms,
  EMS_DB_ROLES,
  RETURN_DEADLINE_DAY,
  REMINDER_LAST_DAY,
  MONTH_NAMES,
  returnDeadline,
  previousMonth,
  monthRange,
  monthLabel,
  toDateInputValue,
  type EmsPerms,
} from '@/lib/ems-constants';

// ------------------------------------------------------------------
// Auth & scoping
// ------------------------------------------------------------------

export interface EmsAuth {
  user: JwtPayload;
  perms: EmsPerms;
  /** station id the caller is restricted to (Officer/Manager), or null when the caller can see every office. */
  stationScope: number | null;
}

/**
 * Authenticates the request and enforces an optional permission check.
 * Returns the auth context, or a ready-made error response:
 *   const a = emsAuth(req, (p) => p.canViewReports);
 *   if (a instanceof NextResponse) return a;
 */
export function emsAuth(
  req: NextRequest,
  check?: (perms: EmsPerms) => boolean,
  denyMessage = 'You do not have permission to perform this action'
): EmsAuth | NextResponse {
  const user = verifyAuth(req);
  if (!user) return unauthorizedResponse();
  const perms = emsPerms(user.role);
  if (!perms.isEms) return forbiddenResponse('You do not have access to the EMS system');
  if (check && !check(perms)) return forbiddenResponse(denyMessage);
  if (perms.isOfficeScoped && !user.stationId) {
    return forbiddenResponse('No office is assigned to your account. Please contact the IT Admin.');
  }
  return { user, perms, stationScope: perms.isOfficeScoped ? user.stationId : null };
}

export function serverError(err: any, context: string) {
  console.error(`[EMS] ${context}:`, err);
  return NextResponse.json({ message: 'Internal Server Error', error: err?.message }, { status: 500 });
}

/** True when a MySQL duplicate-key error refers to the given key/column fragment. */
export function isDuplicateOn(err: any, fragment: string): boolean {
  return err?.code === 'ER_DUP_ENTRY' && String(err?.message || '').includes(fragment);
}

/** Parses 'YYYY-MM-DD' into a local Date (midnight). Returns null when invalid. */
export function parseDateOnly(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
  return d;
}

export function money(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

export function toMoneyString(n: number): string {
  return n.toFixed(2);
}

// ------------------------------------------------------------------
// Roles
// ------------------------------------------------------------------

/** Makes sure the EMS roles exist (idempotent). Returns name -> id. */
export async function ensureEmsRoles(): Promise<Record<string, number>> {
  const existing = await db.select({ id: s.roles.id, name: s.roles.name }).from(s.roles);
  const map: Record<string, number> = {};
  existing.forEach((r) => (map[r.name] = r.id));
  for (const role of EMS_DB_ROLES) {
    if (!map[role.name]) {
      try {
        const [ins] = await db.insert(s.roles).values({ name: role.name, description: role.description });
        map[role.name] = ins.insertId;
      } catch (err: any) {
        if (err?.code !== 'ER_DUP_ENTRY') throw err;
        const [row] = await db.select({ id: s.roles.id }).from(s.roles).where(eq(s.roles.name, role.name)).limit(1);
        if (row) map[role.name] = row.id;
      }
    }
  }
  return map;
}

export async function findUsersByRoleAtStation(stationId: number | null, roleNames: string[]): Promise<number[]> {
  const conditions = [inArray(s.roles.name, roleNames), isNull(s.users.deletedAt)];
  if (stationId !== null) conditions.push(eq(s.users.stationId, stationId));
  const rows = await db
    .select({ id: s.users.id })
    .from(s.users)
    .innerJoin(s.roles, eq(s.users.roleId, s.roles.id))
    .where(and(...conditions));
  return rows.map((r) => r.id);
}

// ------------------------------------------------------------------
// Notifications (in-app only)
// ------------------------------------------------------------------

export type EmsNotificationType =
  | 'NewEntryToVerify'
  | 'EntryRejected'
  | 'MonthlyReminder'
  | 'OverdueSubmission'
  | 'ReturnSubmitted'
  | 'ReturnUnlocked'
  | 'ReturnApproved';

export async function notifyUsers(
  userIds: number[],
  type: EmsNotificationType,
  message: string,
  opts: { dispatchId?: number; returnId?: number; dedupeKey?: string } = {}
): Promise<void> {
  try {
    let targets = Array.from(new Set(userIds));
    if (targets.length === 0) return;

    if (opts.dedupeKey) {
      const already = await db
        .select({ userId: s.emsNotifications.userId })
        .from(s.emsNotifications)
        .where(and(eq(s.emsNotifications.dedupeKey, opts.dedupeKey), inArray(s.emsNotifications.userId, targets)));
      const skip = new Set(already.map((a) => a.userId));
      targets = targets.filter((id) => !skip.has(id));
      if (targets.length === 0) return;
    }

    await db.insert(s.emsNotifications).values(
      targets.map((userId) => ({
        userId,
        type,
        message,
        dispatchId: opts.dispatchId ?? null,
        returnId: opts.returnId ?? null,
        dedupeKey: opts.dedupeKey ?? null,
      }))
    );
  } catch (err: any) {
    // A concurrent request may have inserted the same (user, dedupeKey): that is fine.
    if (err?.code !== 'ER_DUP_ENTRY') console.error('[EMS] notifyUsers failed:', err);
  }
}

// ------------------------------------------------------------------
// Dispatch loading (scoped)
// ------------------------------------------------------------------

/** Loads a dispatch row; returns null when it does not exist or is outside the caller's office scope. */
export async function getScopedDispatch(id: number, stationScope: number | null) {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [row] = await db.select().from(s.emsDispatches).where(eq(s.emsDispatches.id, id)).limit(1);
  if (!row) return null;
  if (stationScope !== null && row.stationId !== stationScope) return null;
  return row;
}

// ------------------------------------------------------------------
// Offices, returns, locks
// ------------------------------------------------------------------

export interface OfficeInfo {
  stationId: number;
  stationName: string;
  stationCode: string;
  regionId: number;
  regionName: string;
}

/** Offices that take part in EMS = stations that have at least one active EMS Admin Officer. */
export async function getActiveOffices(): Promise<OfficeInfo[]> {
  return db
    .select({
      stationId: s.stations.id,
      stationName: s.stations.name,
      stationCode: s.stations.code,
      regionId: s.regions.id,
      regionName: s.regions.name,
    })
    .from(s.users)
    .innerJoin(s.roles, eq(s.users.roleId, s.roles.id))
    .innerJoin(s.stations, eq(s.users.stationId, s.stations.id))
    .innerJoin(s.regions, eq(s.stations.regionId, s.regions.id))
    .where(and(eq(s.roles.name, 'EMS_Admin_Officer'), isNull(s.users.deletedAt), isNull(s.stations.deletedAt)))
    .groupBy(s.stations.id, s.stations.name, s.stations.code, s.regions.id, s.regions.name)
    .orderBy(s.regions.name, s.stations.name);
}

/** A (station, month) is locked when its return is Submitted or Approved. 'Unlocked' re-opens editing. */
export async function getPeriodReturn(stationId: number, date: Date) {
  const [row] = await db
    .select()
    .from(s.emsMonthlyReturns)
    .where(
      and(
        eq(s.emsMonthlyReturns.stationId, stationId),
        eq(s.emsMonthlyReturns.year, date.getFullYear()),
        eq(s.emsMonthlyReturns.month, date.getMonth() + 1)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function isPeriodLocked(stationId: number, date: Date): Promise<boolean> {
  const r = await getPeriodReturn(stationId, date);
  return !!r && (r.status === 'Submitted' || r.status === 'Approved');
}

/** Verified totals for a station-month (what a monthly return is compiled from). */
export async function computeStationMonth(stationId: number, year: number, month: number) {
  const { start, end } = monthRange(year, month);
  const rows = await db
    .select({
      status: s.emsDispatches.status,
      letters: sql<number>`COUNT(*)`,
      cost: sql<string>`COALESCE(SUM(${s.emsDispatches.cost}), 0)`,
    })
    .from(s.emsDispatches)
    .where(and(eq(s.emsDispatches.stationId, stationId), gte(s.emsDispatches.dispatchDate, start), lt(s.emsDispatches.dispatchDate, end)))
    .groupBy(s.emsDispatches.status);

  const by = (st: string) => rows.find((r) => r.status === st);
  return {
    verifiedLetters: Number(by('Verified')?.letters ?? 0),
    verifiedCost: money(by('Verified')?.cost),
    pendingCount: Number(by('Pending')?.letters ?? 0),
    pendingCost: money(by('Pending')?.cost),
    rejectedCount: Number(by('Rejected')?.letters ?? 0),
    rejectedCost: money(by('Rejected')?.cost),
  };
}

export type ComplianceState = 'Submitted' | 'Pending' | 'NotSubmitted';

export interface ComplianceRow extends OfficeInfo {
  state: ComplianceState;
  returnId: number | null;
  returnStatus: 'Submitted' | 'Approved' | 'Unlocked' | null;
  isLate: boolean;
  submittedAt: Date | null;
  totalLetters: number;
  totalCost: number;
  pendingCount: number;
  unlockReason: string | null;
}

/**
 * Green = Submitted/Approved, Yellow = Pending (not yet submitted, deadline not passed),
 * Red = Not Submitted (deadline passed).
 */
export async function computeCompliance(year: number, month: number, now: Date = new Date()) {
  const offices = await getActiveOffices();
  const deadline = returnDeadline(year, month);
  const pastDeadline = now.getTime() > deadline.getTime();
  const { start, end } = monthRange(year, month);

  const [returns, liveRows] = await Promise.all([
    db.select().from(s.emsMonthlyReturns).where(and(eq(s.emsMonthlyReturns.year, year), eq(s.emsMonthlyReturns.month, month))),
    db
      .select({
        stationId: s.emsDispatches.stationId,
        status: s.emsDispatches.status,
        letters: sql<number>`COUNT(*)`,
        cost: sql<string>`COALESCE(SUM(${s.emsDispatches.cost}), 0)`,
      })
      .from(s.emsDispatches)
      .where(and(gte(s.emsDispatches.dispatchDate, start), lt(s.emsDispatches.dispatchDate, end)))
      .groupBy(s.emsDispatches.stationId, s.emsDispatches.status),
  ]);

  const returnByStation = new Map(returns.map((r) => [r.stationId, r]));
  const rows: ComplianceRow[] = offices.map((o) => {
    const ret = returnByStation.get(o.stationId);
    const live = liveRows.filter((l) => l.stationId === o.stationId);
    const verified = live.find((l) => l.status === 'Verified');
    const pending = live.find((l) => l.status === 'Pending');
    const submitted = !!ret && (ret.status === 'Submitted' || ret.status === 'Approved');
    return {
      ...o,
      state: submitted ? 'Submitted' : pastDeadline ? 'NotSubmitted' : 'Pending',
      returnId: ret?.id ?? null,
      returnStatus: ret?.status ?? null,
      isLate: ret?.isLate ?? false,
      submittedAt: ret?.submittedAt ?? null,
      totalLetters: submitted ? ret!.totalLetters : Number(verified?.letters ?? 0),
      totalCost: submitted ? money(ret!.totalCost) : money(verified?.cost),
      pendingCount: Number(pending?.letters ?? 0),
      unlockReason: ret?.status === 'Unlocked' ? ret.unlockReason : null,
    };
  });

  return {
    year,
    month,
    deadline,
    pastDeadline,
    offices: rows,
    counts: {
      submitted: rows.filter((r) => r.state === 'Submitted').length,
      pending: rows.filter((r) => r.state === 'Pending').length,
      notSubmitted: rows.filter((r) => r.state === 'NotSubmitted').length,
    },
  };
}

// ------------------------------------------------------------------
// Reference IDs  (DVLA/<REGION>/<OFFICE>/<MM>/<0001>)
// ------------------------------------------------------------------

export async function referencePrefix(stationId: number, date: Date): Promise<string> {
  const [row] = await db
    .select({ stationCode: s.stations.code, regionCode: s.regions.code })
    .from(s.stations)
    .innerJoin(s.regions, eq(s.stations.regionId, s.regions.id))
    .where(eq(s.stations.id, stationId))
    .limit(1);
  const region = (row?.regionCode || 'XX').slice(0, 2).toUpperCase();
  const office = (row?.stationCode || 'OFC').split('-')[0].toUpperCase();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `DVLA/${region}/${office}/${mm}/`;
}

/** Next free sequence number for a prefix (callers retry on duplicate-key collisions). */
export async function nextReferenceSeq(prefix: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(s.emsDispatches)
    .where(sql`${s.emsDispatches.referenceId} LIKE ${prefix + '%'}`);
  return Number(row?.count ?? 0) + 1;
}

export function formatReferenceId(prefix: string, seq: number): string {
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// ------------------------------------------------------------------
// Scheduled checks (reminders / overdue). There is no cron in this deployment, so the checks run
// lazily (throttled) whenever notifications or the dashboard are loaded. They are idempotent via dedupeKey.
// ------------------------------------------------------------------

let lastScheduledRun = 0;

export async function runEmsScheduledChecks(force = false): Promise<void> {
  const nowMs = Date.now();
  if (!force && nowMs - lastScheduledRun < 5 * 60 * 1000) return;
  lastScheduledRun = nowMs;

  try {
    const now = new Date();
    const day = now.getDate();
    const inReminderWindow = day <= REMINDER_LAST_DAY;
    const overdue = day > RETURN_DEADLINE_DAY;
    if (!inReminderWindow && !overdue) return; // the deadline day itself: nothing new to send

    const prev = previousMonth(now);
    const label = monthLabel(prev.year, prev.month);
    const compliance = await computeCompliance(prev.year, prev.month, now);
    const missing = compliance.offices.filter((o) => o.state !== 'Submitted');
    if (missing.length === 0) return;

    const dayKey = toDateInputValue(now);
    const stationIds = missing.map((m) => m.stationId);
    const staff = await db
      .select({ id: s.users.id, stationId: s.users.stationId, role: s.roles.name })
      .from(s.users)
      .innerJoin(s.roles, eq(s.users.roleId, s.roles.id))
      .where(
        and(
          inArray(s.roles.name, ['EMS_Admin_Officer', 'EMS_Manager']),
          inArray(s.users.stationId, stationIds),
          isNull(s.users.deletedAt)
        )
      );

    const deadlineText = `${RETURN_DEADLINE_DAY} ${MONTH_NAMES[prev.month % 12]}`;

    for (const office of missing) {
      const officeStaff = staff.filter((u) => u.stationId === office.stationId);
      if (inReminderWindow) {
        await notifyUsers(
          officeStaff.filter((u) => u.role === 'EMS_Admin_Officer').map((u) => u.id),
          'MonthlyReminder',
          `Reminder: generate and submit the EMS monthly return for ${label} (${office.stationName}) by ${deadlineText}.`,
          { dedupeKey: `reminder:${prev.year}-${prev.month}:${dayKey}` }
        );
      } else {
        await notifyUsers(
          officeStaff.map((u) => u.id),
          'OverdueSubmission',
          `Overdue: the EMS monthly return for ${label} (${office.stationName}) was due on ${deadlineText} and has not been submitted.`,
          { dedupeKey: `overdue:${prev.year}-${prev.month}:${dayKey}` }
        );
      }
    }

    if (overdue) {
      const hq = await findUsersByRoleAtStation(null, ['EMS_Director']);
      await notifyUsers(
        hq,
        'OverdueSubmission',
        `${missing.length} office${missing.length === 1 ? ' has' : 's have'} not submitted the EMS monthly return for ${label}.`,
        { dedupeKey: `overdue-hq:${prev.year}-${prev.month}:${dayKey}` }
      );
    }
  } catch (err) {
    console.error('[EMS] scheduled checks failed:', err);
  }
}
