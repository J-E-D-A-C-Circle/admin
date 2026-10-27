// Shared (client + server safe) constants, role/permission matrix and date helpers for the EMS module.
// NOTE: keep this file free of server-only imports (db, fs, jsonwebtoken...).

export const EMS_PURPOSES = [
  'Letter to HQ',
  'Letter to Police',
  'Client Letter',
  'Court',
  'Procurement',
  'Other',
] as const;
export type EmsPurpose = (typeof EMS_PURPOSES)[number];

export type EmsDispatchStatus = 'Pending' | 'Verified' | 'Rejected';
export type EmsReturnStatus = 'Submitted' | 'Approved' | 'Unlocked';

/** SRS 5.1: receipt upload is part of the mandatory entry form. Flip to false to make it optional (SRS 4.2h). */
export const RECEIPT_REQUIRED = true;
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_RECEIPT_MIME = ['image/jpeg', 'image/png', 'application/pdf'] as const;

/** Monthly return is due on the 5th of the following month. */
export const RETURN_DEADLINE_DAY = 5;
/** Reminders are produced from the 1st to the 4th. */
export const REMINDER_LAST_DAY = 4;
/** Alert when an office has not logged anything for this many days. */
export const NO_ENTRY_ALERT_DAYS = 7;
/** Auto-logout after this much inactivity (SRS 5.6). */
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

// ------------------------------------------------------------------
// Roles
// ------------------------------------------------------------------

/** Role strings exactly as they appear in the JWT (formatted from the DB role names in /api/auth/login). */
export const EMS_ROLES = {
  SUPER: 'Super Admin',
  IT: 'EMS IT Admin',
  OFFICER: 'EMS Admin Officer',
  MANAGER: 'EMS Manager',
  DIRECTOR: 'EMS Director',
  FINANCE: 'EMS Finance Audit',
} as const;

/** DB role names (dms_roles.name) created for EMS. */
export const EMS_DB_ROLES = [
  { name: 'EMS_IT_Admin', label: 'IT Admin', description: 'EMS IT Admin: creates users, assigns offices, manages backups. Cannot edit money figures.' },
  { name: 'EMS_Admin_Officer', label: 'Admin Officer', description: 'EMS Admin Officer: logs dispatches, uploads receipts, submits the monthly return for own office.' },
  { name: 'EMS_Manager', label: 'Manager', description: 'EMS Manager (Regional/District/Station Head): verifies or rejects entries from own office.' },
  { name: 'EMS_Director', label: 'Director, Administration (HQ)', description: 'EMS Director, Administration (HQ): national oversight, approves returns, exports reports, creates user accounts.' },
  { name: 'EMS_Finance_Audit', label: 'Finance / Audit', description: 'EMS Finance / Audit: view and export only.' },
] as const;

export const EMS_DB_ROLE_NAMES: string[] = EMS_DB_ROLES.map((r) => r.name);

/** Maps a JWT role string to a short human label. */
export function emsRoleLabel(role?: string | null): string {
  switch (role) {
    case EMS_ROLES.SUPER: return 'Super Admin';
    case EMS_ROLES.IT: return 'IT Admin';
    case EMS_ROLES.OFFICER: return 'Admin Officer';
    case EMS_ROLES.MANAGER: return 'Manager';
    case EMS_ROLES.DIRECTOR: return 'Director, Administration';
    case EMS_ROLES.FINANCE: return 'Finance / Audit';
    default: return role || 'Unknown';
  }
}

export interface EmsPerms {
  /** Has any access to the EMS module. */
  isEms: boolean;
  /** Data is limited to the user's own office (station). */
  isOfficeScoped: boolean;
  canViewDispatches: boolean;
  canCreateDispatch: boolean;
  canEditDispatch: boolean;
  canVerify: boolean;
  canSubmitReturn: boolean;
  canApproveReturn: boolean;
  canViewReturns: boolean;
  canViewCompliance: boolean;
  canViewReports: boolean;
  canViewConsolidated: boolean;
  canViewAudit: boolean;
  canManageUsers: boolean;
}

const NO_ACCESS: EmsPerms = {
  isEms: false,
  isOfficeScoped: false,
  canViewDispatches: false,
  canCreateDispatch: false,
  canEditDispatch: false,
  canVerify: false,
  canSubmitReturn: false,
  canApproveReturn: false,
  canViewReturns: false,
  canViewCompliance: false,
  canViewReports: false,
  canViewConsolidated: false,
  canViewAudit: false,
  canManageUsers: false,
};

/**
 * Role -> permission matrix (SRS section 4, "User Roles").
 * Segregation of duties: Super Admin / Director oversee and approve but never create or verify entries;
 * IT Admin can see data but can never change money figures.
 */
export function emsPerms(role?: string | null): EmsPerms {
  switch (role) {
    case EMS_ROLES.SUPER:
      return {
        ...NO_ACCESS,
        isEms: true,
        canViewDispatches: true,
        canViewReturns: true,
        canApproveReturn: true,
        canViewCompliance: true,
        canViewReports: true,
        canViewConsolidated: true,
        canViewAudit: true,
        canManageUsers: true,
      };
    case EMS_ROLES.IT:
      return {
        ...NO_ACCESS,
        isEms: true,
        canViewDispatches: true,
        canViewReturns: true,
        canViewCompliance: true,
        canViewAudit: true,
        canManageUsers: true,
      };
    case EMS_ROLES.OFFICER:
      return {
        ...NO_ACCESS,
        isEms: true,
        isOfficeScoped: true,
        canViewDispatches: true,
        canCreateDispatch: true,
        canEditDispatch: true,
        canSubmitReturn: true,
        canViewReturns: true,
        canViewReports: true,
      };
    case EMS_ROLES.MANAGER:
      return {
        ...NO_ACCESS,
        isEms: true,
        isOfficeScoped: true,
        canViewDispatches: true,
        canVerify: true,
        canViewReturns: true,
        canViewReports: true,
      };
    case EMS_ROLES.DIRECTOR:
      return {
        ...NO_ACCESS,
        isEms: true,
        canViewDispatches: true,
        canApproveReturn: true,
        canViewReturns: true,
        canViewCompliance: true,
        canViewReports: true,
        canViewConsolidated: true,
        canViewAudit: true,
        canManageUsers: true,
      };
    case EMS_ROLES.FINANCE:
      return {
        ...NO_ACCESS,
        isEms: true,
        canViewDispatches: true,
        canViewReturns: true,
        canViewCompliance: true,
        canViewReports: true,
        canViewConsolidated: true,
        canViewAudit: true,
      };
    default:
      return NO_ACCESS;
  }
}

// ------------------------------------------------------------------
// Date / money helpers
// ------------------------------------------------------------------

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Deadline for the return of (year, month 1-12): the 5th of the next month, end of day. */
export function returnDeadline(year: number, month: number): Date {
  return new Date(year, month, RETURN_DEADLINE_DAY, 23, 59, 59, 999);
}

/** Month before `d` (month is 1-12). */
export function previousMonth(d: Date = new Date()): { year: number; month: number } {
  const m = d.getMonth(); // 0-11 => previous month number (1-12) is m, or 12 when m === 0
  return m === 0 ? { year: d.getFullYear() - 1, month: 12 } : { year: d.getFullYear(), month: m };
}

/** First instant of the month and the first instant of the following month. */
export function monthRange(year: number, month: number): { start: Date; end: Date } {
  return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) };
}

export function formatGHS(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  const safe = Number.isFinite(n as number) ? (n as number) : 0;
  return `GHS ${safe.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  const p = (x: number) => String(x).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
