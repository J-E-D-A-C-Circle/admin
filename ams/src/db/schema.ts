import { sql } from 'drizzle-orm';
import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  boolean,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';

export const roles = mysqlTable('roles', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
});

export const regions = mysqlTable('regions', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  code: varchar('code', { length: 10 }).notNull().unique(),
});

export const stations = mysqlTable('stations', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  regionId: int('region_id').notNull().references(() => regions.id),
});

export const departments = mysqlTable('departments', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull().unique(),
});

export const employees = mysqlTable('employees', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  position: varchar('position', { length: 100 }).notNull(),
  departmentId: int('department_id').notNull().references(() => departments.id),
  stationId: int('station_id').notNull().references(() => stations.id),
});

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  roleId: int('role_id').notNull().references(() => roles.id),
  regionId: int('region_id').references(() => regions.id),
  stationId: int('station_id').references(() => stations.id),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const assetCategories = mysqlTable('asset_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  code: varchar('code', { length: 10 }).notNull().unique(),
});

export const assetSubcategories = mysqlTable('asset_subcategories', {
  id: int('id').primaryKey().autoincrement(),
  categoryId: int('category_id').notNull().references(() => assetCategories.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 10 }).notNull().unique(),
});

export const assets = mysqlTable('assets', {
  assetId: varchar('asset_id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: int('category_id').notNull().references(() => assetCategories.id),
  subcategoryId: int('subcategory_id').notNull().references(() => assetSubcategories.id),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }).notNull().unique(),
  licensePlate: varchar('license_plate', { length: 50 }),
  engineNumber: varchar('engine_number', { length: 100 }),
  purchaseValue: varchar('purchase_value', { length: 20 }),
  description: text('description'),
  regionId: int('region_id').notNull().references(() => regions.id),
  stationId: int('station_id').notNull().references(() => stations.id),
  departmentId: int('department_id').notNull().references(() => departments.id),
  assignedEmployeeId: int('assigned_employee_id').references(() => employees.id),
  status: mysqlEnum('status', ['Active', 'Under_Maintenance', 'Damaged', 'Missing', 'Disposed']).default('Active').notNull(),
  acquisitionDate: datetime('acquisition_date').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastVerificationDate: datetime('last_verification_date'),
});

export const assetTransfers = mysqlTable('asset_transfers', {
  id: int('id').primaryKey().autoincrement(),
  assetId: varchar('asset_id', { length: 50 }).notNull().references(() => assets.assetId, { onDelete: 'cascade' }),
  fromRegionId: int('from_region_id').notNull().references(() => regions.id),
  toRegionId: int('to_region_id').notNull().references(() => regions.id),
  fromStationId: int('from_station_id').notNull().references(() => stations.id),
  toStationId: int('to_station_id').notNull().references(() => stations.id),
  fromDepartmentId: int('from_department_id').notNull().references(() => departments.id),
  toDepartmentId: int('to_department_id').notNull().references(() => departments.id),
  previousEmployeeId: int('previous_employee_id').references(() => employees.id),
  newEmployeeId: int('new_employee_id').references(() => employees.id),
  transferDate: datetime('transfer_date').default(sql`CURRENT_TIMESTAMP`).notNull(),
  reason: text('reason').notNull(),
  transferredByUserId: int('transferred_by_user_id').notNull().references(() => users.id),
  status: mysqlEnum('status', ['Pending', 'Approved', 'Rejected']).default('Pending').notNull(),
  approvedByUserId: int('approved_by_user_id').references(() => users.id),
  approvalDate: datetime('approval_date'),
  signatureUrl: varchar('signature_url', { length: 255 }),
});

export const assetVerifications = mysqlTable('asset_verifications', {
  id: int('id').primaryKey().autoincrement(),
  assetId: varchar('asset_id', { length: 50 }).notNull().references(() => assets.assetId, { onDelete: 'cascade' }),
  verificationDate: datetime('verification_date').default(sql`CURRENT_TIMESTAMP`).notNull(),
  verifiedByUserId: int('verified_by_user_id').notNull().references(() => users.id),
  verificationType: mysqlEnum('verification_type', ['Quarterly', 'Half_Yearly', 'Annual']).notNull(),
  status: mysqlEnum('verification_status', ['Verified', 'Missing', 'Damaged']).notNull(),
  comments: text('comments'),
  latitude: varchar('latitude', { length: 50 }),
  longitude: varchar('longitude', { length: 50 }),
  verifiedAtStationId: int('verified_at_station_id').references(() => stations.id),
  photoUrl: varchar('photo_url', { length: 255 }),
});

export const assetHistory = mysqlTable('asset_history', {
  id: int('id').primaryKey().autoincrement(),
  assetId: varchar('asset_id', { length: 50 }).notNull().references(() => assets.assetId, { onDelete: 'cascade' }),
  actionType: mysqlEnum('action_type', ['Created', 'Updated', 'StationChange', 'DepartmentChange', 'EmployeeReassignment', 'StatusChange', 'Disposed', 'MaintenanceLogged']).notNull(),
  description: text('description').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  userId: int('user_id').notNull().references(() => users.id),
});

export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').primaryKey().autoincrement(),
  action: varchar('action', { length: 255 }).notNull(),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  affectedRecord: varchar('affected_record', { length: 255 }),
});

export const notifications = mysqlTable('notifications', {
  id: int('id').primaryKey().autoincrement(),
  type: mysqlEnum('type', ['NewAsset', 'AssetUpdated', 'AssetMissing', 'AssetTransferred', 'VerificationDue', 'VerificationOverdue']).notNull(),
  message: text('message').notNull(),
  assetId: varchar('asset_id', { length: 50 }).references(() => assets.assetId, { onDelete: 'set null' }),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const disposals = mysqlTable('disposals', {
  id: int('id').primaryKey().autoincrement(),
  assetId: varchar('asset_id', { length: 50 }).notNull().references(() => assets.assetId, { onDelete: 'cascade' }),
  disposalMethod: mysqlEnum('disposal_method', ['Auction', 'Scrapped', 'Donated', 'Written_Off']).notNull(),
  authorisedByUserId: int('authorised_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  disposalDate: datetime('disposal_date').notNull(),
  realisedValue: varchar('realised_value', { length: 20 }),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const maintenanceSchedules = mysqlTable('maintenance_schedules', {
  id: int('id').primaryKey().autoincrement(),
  assetId: varchar('asset_id', { length: 50 }).notNull().references(() => assets.assetId, { onDelete: 'cascade' }),
  serviceType: mysqlEnum('service_type', ['Routine', 'Major', 'Emergency']).notNull(),
  serviceDate: datetime('service_date').notNull(),
  nextServiceDueDate: datetime('next_service_due_date'),
  odometerReading: int('odometer_reading'),
  serviceNotes: text('service_notes'),
  recordedByUserId: int('recorded_by_user_id').notNull().references(() => users.id),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
