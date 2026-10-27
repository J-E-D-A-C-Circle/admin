import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  decimal,
  mysqlEnum,
  boolean,
  index,
  uniqueIndex
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// REGIONS TABLE
export const regions = mysqlTable('dms_regions', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// STATIONS / OFFICES TABLE
export const stations = mysqlTable('dms_stations', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  location: varchar('location', { length: 150 }),
  regionId: int('region_id').notNull().references(() => regions.id),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
  deletedAt: datetime('deleted_at'),
}, (table) => ({
  regionIdx: index('idx_stations_region').on(table.regionId),
  codeIdx: index('idx_stations_code').on(table.code),
}));

// ROLES TABLE
export const roles = mysqlTable('dms_roles', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
});

// USERS TABLE
export const users = mysqlTable('dms_users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  roleId: int('role_id').notNull().references(() => roles.id),
  regionId: int('region_id').references(() => regions.id),
  stationId: int('station_id').references(() => stations.id),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
  deletedAt: datetime('deleted_at'),
}, (table) => ({
  roleIdx: index('idx_users_role').on(table.roleId),
  stationIdx: index('idx_users_station').on(table.stationId),
}));

// EMS DISPATCHES TABLE
export const emsDispatches = mysqlTable('ems_dispatches', {
  id: int('id').primaryKey().autoincrement(),
  referenceId: varchar('reference_id', { length: 50 }).notNull().unique(),
  dispatchDate: datetime('dispatch_date').notNull(),
  regionId: int('region_id').notNull().references(() => regions.id),
  stationId: int('station_id').notNull().references(() => stations.id),
  recipientName: varchar('recipient_name', { length: 150 }).notNull(),
  institution: varchar('institution', { length: 200 }).notNull(),
  destination: varchar('destination', { length: 150 }).notNull(),
  emsTrackingNumber: varchar('ems_tracking_number', { length: 50 }).notNull().unique(),
  purpose: mysqlEnum('purpose', ['Letter to HQ', 'Letter to Police', 'Client Letter', 'Court', 'Procurement', 'Other']).notNull(),
  referenceNo: varchar('reference_no', { length: 100 }).notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
  receiptFile: varchar('receipt_file', { length: 255 }),
  receiptOriginalName: varchar('receipt_original_name', { length: 255 }),
  receiptMime: varchar('receipt_mime', { length: 100 }),
  status: mysqlEnum('status', ['Pending', 'Verified', 'Rejected']).default('Pending').notNull(),
  rejectionReason: text('rejection_reason'),
  createdByUserId: int('created_by_user_id').notNull().references(() => users.id),
  verifiedByUserId: int('verified_by_user_id').references(() => users.id),
  verifiedAt: datetime('verified_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  stationDateIdx: index('idx_ems_disp_station_date').on(table.stationId, table.dispatchDate),
  regionIdx: index('idx_ems_disp_region').on(table.regionId),
  statusIdx: index('idx_ems_disp_status').on(table.status),
  dateIdx: index('idx_ems_disp_date').on(table.dispatchDate),
}));

// EMS MONTHLY RETURNS TABLE
export const emsMonthlyReturns = mysqlTable('ems_monthly_returns', {
  id: int('id').primaryKey().autoincrement(),
  stationId: int('station_id').notNull().references(() => stations.id),
  regionId: int('region_id').notNull().references(() => regions.id),
  year: int('year').notNull(),
  month: int('month').notNull(),
  totalLetters: int('total_letters').default(0).notNull(),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }).default('0.00').notNull(),
  status: mysqlEnum('status', ['Submitted', 'Approved', 'Unlocked']).default('Submitted').notNull(),
  isLate: boolean('is_late').default(false).notNull(),
  submittedByUserId: int('submitted_by_user_id').references(() => users.id),
  submittedAt: datetime('submitted_at'),
  approvedByUserId: int('approved_by_user_id').references(() => users.id),
  approvedAt: datetime('approved_at'),
  unlockReason: text('unlock_reason'),
  unlockedByUserId: int('unlocked_by_user_id').references(() => users.id),
  unlockedAt: datetime('unlocked_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  periodUnique: uniqueIndex('uq_ems_return_period').on(table.stationId, table.year, table.month),
  statusIdx: index('idx_ems_return_status').on(table.status),
}));

// EMS NOTIFICATIONS TABLE
export const emsNotifications = mysqlTable('ems_notifications', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: mysqlEnum('type', ['NewEntryToVerify', 'EntryRejected', 'MonthlyReminder', 'OverdueSubmission', 'ReturnSubmitted', 'ReturnUnlocked', 'ReturnApproved']).notNull(),
  message: text('message').notNull(),
  dispatchId: int('dispatch_id'),
  returnId: int('return_id'),
  dedupeKey: varchar('dedupe_key', { length: 120 }),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userReadIdx: index('idx_ems_notif_user_read').on(table.userId, table.isRead),
  dedupeUnique: uniqueIndex('uq_ems_notif_dedupe').on(table.userId, table.dedupeKey),
}));

// AUDIT LOGS TABLE
export const auditLogs = mysqlTable('dms_audit_logs', {
  id: int('id').primaryKey().autoincrement(),
  action: varchar('action', { length: 100 }).notNull(),
  userId: int('user_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  affectedRecord: varchar('affected_record', { length: 255 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
