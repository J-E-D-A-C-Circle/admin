import { db } from './index';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';

async function main() {
  console.log('🌱 Seeding DAMS database with Drizzle ORM...');

  console.log('🧹 Clearing existing database tables...');
  const tables = [
    'maintenance_schedules',
    'disposals',
    'notifications',
    'audit_logs',
    'asset_history',
    'asset_verifications',
    'asset_transfers',
    'assets',
    'employees',
    'users',
    'asset_subcategories',
    'asset_categories',
    'departments',
    'stations',
    'regions',
    'roles'
  ];
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  for (const table of tables) {
    await db.execute(sql`TRUNCATE TABLE ${sql.raw(table)}`);
  }
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  console.log('✅ Database cleared.');


  // 1. Roles
  const rolesData = [
    { name: 'Super Admin', description: 'Full system access' },
    { name: 'Regional Manager', description: 'Manages assets within a region' },
    { name: 'Station Manager', description: 'Manages assets at a station' },
    { name: 'Asset Officer', description: 'Creates, updates and verifies assets' },
    { name: 'Auditor', description: 'Read-only access to all records' },
  ];

  const rolesMap: Record<string, number> = {};
  for (const r of rolesData) {
    const existing = await db.query.roles.findFirst({
      where: eq(schema.roles.name, r.name),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.roles).values(r);
      rolesMap[r.name] = inserted.insertId;
    } else {
      rolesMap[r.name] = existing.id;
    }
  }
  console.log(`✅ Roles seeded/loaded`);

  // 2. Regions
  const regionData = [
    { name: 'Greater Accra', code: 'GAR' },
    { name: 'Ashanti', code: 'ASH' },
    { name: 'Eastern', code: 'EAS' },
    { name: 'Western', code: 'WES' },
    { name: 'Northern', code: 'NOR' },
    { name: 'Volta', code: 'VOL' },
    { name: 'Central', code: 'CEN' },
  ];
  const regionsMap: Record<string, number> = {};
  for (const r of regionData) {
    const existing = await db.query.regions.findFirst({
      where: eq(schema.regions.code, r.code),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.regions).values(r);
      regionsMap[r.code] = inserted.insertId;
    } else {
      regionsMap[r.code] = existing.id;
    }
  }
  console.log(`✅ Regions seeded/loaded`);

  // 3. Stations
  const stationData = [
    { name: 'Accra Main (37)', regionCode: 'GAR' },
    { name: 'Tema', regionCode: 'GAR' },
    { name: 'Weija', regionCode: 'GAR' },
    { name: 'Amasaman', regionCode: 'GAR' },
    { name: 'Madina', regionCode: 'GAR' },
    { name: 'Kumasi Main', regionCode: 'ASH' },
    { name: 'Obuasi', regionCode: 'ASH' },
    { name: 'Mampong', regionCode: 'ASH' },
    { name: 'Koforidua', regionCode: 'EAS' },
    { name: 'Nkawkaw', regionCode: 'EAS' },
    { name: 'Takoradi', regionCode: 'WES' },
    { name: 'Tarkwa', regionCode: 'WES' },
    { name: 'Tamale', regionCode: 'NOR' },
    { name: 'Ho', regionCode: 'VOL' },
    { name: 'Aflao', regionCode: 'VOL' },
    { name: 'Cape Coast', regionCode: 'CEN' },
    { name: 'Winneba', regionCode: 'CEN' },
  ];
  const stationsMap: Record<string, number> = {};
  for (const s of stationData) {
    const existing = await db.query.stations.findFirst({
      where: eq(schema.stations.name, s.name),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.stations).values({
        name: s.name,
        regionId: regionsMap[s.regionCode],
      });
      stationsMap[s.name] = inserted.insertId;
    } else {
      stationsMap[s.name] = existing.id;
    }
  }
  console.log(`✅ Stations seeded/loaded`);

  // 4. Departments
  const deptData = ['Licensing', 'Vehicle Inspection', 'Administration', 'Finance & Accounts', 'IT & Technical Support', 'Customer Service', 'Audit', 'Operations & Security'];
  const deptsMap: Record<string, number> = {};
  for (const d of deptData) {
    const existing = await db.query.departments.findFirst({
      where: eq(schema.departments.name, d),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.departments).values({ name: d });
      deptsMap[d] = inserted.insertId;
    } else {
      deptsMap[d] = existing.id;
    }
  }
  console.log(`✅ Departments seeded/loaded`);

  // 5. Asset Categories
  const categoryData = [
    { name: 'IT Equipment', code: 'IT' },
    { name: 'Furniture', code: 'FUR' },
    { name: 'Vehicles', code: 'VEH' },
    { name: 'Electrical Equipment', code: 'ELE' },
    { name: 'Security Equipment', code: 'SEC' },
    { name: 'Office Equipment', code: 'OFF' },
  ];
  const catsMap: Record<string, number> = {};
  for (const c of categoryData) {
    const existing = await db.query.assetCategories.findFirst({
      where: eq(schema.assetCategories.code, c.code),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.assetCategories).values(c);
      catsMap[c.code] = inserted.insertId;
    } else {
      catsMap[c.code] = existing.id;
    }
  }

  // 6. Subcategories
  const subcatData = [
    { categoryCode: 'IT', name: 'Laptop', code: 'LAP' },
    { categoryCode: 'IT', name: 'Desktop', code: 'DES' },
    { categoryCode: 'IT', name: 'Printer', code: 'PRI' },
    { categoryCode: 'IT', name: 'Router', code: 'RTR' },
    { categoryCode: 'IT', name: 'Switch', code: 'SWT' },
    { categoryCode: 'IT', name: 'Server', code: 'SRV' },
    { categoryCode: 'FUR', name: 'Chair', code: 'CHA' },
    { categoryCode: 'FUR', name: 'Table', code: 'TAB' },
    { categoryCode: 'FUR', name: 'Cabinet', code: 'CAB' },
    { categoryCode: 'VEH', name: 'Pickup', code: 'PIC' },
    { categoryCode: 'VEH', name: 'SUV', code: 'SUV' },
    { categoryCode: 'VEH', name: 'Motorcycle', code: 'MOT' },
    { categoryCode: 'ELE', name: 'Generator', code: 'GEN' },
    { categoryCode: 'ELE', name: 'UPS', code: 'UPS' },
    { categoryCode: 'ELE', name: 'Air Conditioner', code: 'AC' },
    { categoryCode: 'SEC', name: 'CCTV Camera', code: 'CCT' },
    { categoryCode: 'SEC', name: 'Access Control', code: 'ACS' },
    { categoryCode: 'SEC', name: 'Metal Detector', code: 'MET' },
    { categoryCode: 'OFF', name: 'Shredder', code: 'SHR' },
    { categoryCode: 'OFF', name: 'Projector', code: 'PRJ' },
  ];
  const subcatsMap: Record<string, number> = {};
  for (const s of subcatData) {
    const existing = await db.query.assetSubcategories.findFirst({
      where: eq(schema.assetSubcategories.code, s.code),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.assetSubcategories).values({
        categoryId: catsMap[s.categoryCode],
        name: s.name,
        code: s.code,
      });
      subcatsMap[s.code] = inserted.insertId;
    } else {
      subcatsMap[s.code] = existing.id;
    }
  }
  console.log(`✅ Categories & Subcategories seeded/loaded`);

  // 7. Employees
  const empData = [
    { employeeId: 'EMP-GAR-001', name: 'Kwabena Mensah', position: 'Senior Licensing Officer', deptName: 'Licensing', stationName: 'Accra Main (37)' },
    { employeeId: 'EMP-GAR-002', name: 'Yaw Boateng', position: 'IT Support Technician', deptName: 'IT & Technical Support', stationName: 'Accra Main (37)' },
    { employeeId: 'EMP-ASH-001', name: 'Abena Osei', position: 'Administrative Officer', deptName: 'Administration', stationName: 'Kumasi Main' },
    { employeeId: 'EMP-WES-001', name: 'Esi Ansah', position: 'Finance Officer', deptName: 'Finance & Accounts', stationName: 'Takoradi' },
    { employeeId: 'EMP-EAS-001', name: 'Kofi Dede', position: 'Vehicle Inspector', deptName: 'Vehicle Inspection', stationName: 'Koforidua' },
    { employeeId: 'EMP-GAR-003', name: 'Amma Addo', position: 'Customer Relations Executive', deptName: 'Customer Service', stationName: 'Tema' },
  ];
  const empsMap: Record<string, number> = {};
  for (const e of empData) {
    const existing = await db.query.employees.findFirst({
      where: eq(schema.employees.employeeId, e.employeeId),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.employees).values({
        employeeId: e.employeeId,
        name: e.name,
        position: e.position,
        departmentId: deptsMap[e.deptName],
        stationId: stationsMap[e.stationName],
      });
      empsMap[e.employeeId] = inserted.insertId;
    } else {
      empsMap[e.employeeId] = existing.id;
    }
  }
  console.log(`✅ Employees seeded/loaded`);

  // 8. Users (password: "password123")
  const passwordHash = await bcrypt.hash('password123', 12);
  const userData = [
    { username: 'admin', name: 'Super Admin User', email: 'admin@dvla.gov.gh', roleName: 'Super Admin' },
    { username: 'rm_accra', name: 'Accra Regional Manager', email: 'rm.accra@dvla.gov.gh', roleName: 'Regional Manager', regionCode: 'GAR' },
    { username: 'sm_tema', name: 'Tema Station Manager', email: 'sm.tema@dvla.gov.gh', roleName: 'Station Manager', stationName: 'Tema' },
    { username: 'officer', name: 'Asset Officer One', email: 'officer@dvla.gov.gh', roleName: 'Asset Officer' },
    { username: 'auditor', name: 'National Auditor', email: 'auditor@dvla.gov.gh', roleName: 'Auditor' },
  ];
  const usersMap: Record<string, number> = {};
  for (const u of userData) {
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.username, u.username),
    });
    if (!existing) {
      const [inserted] = await db.insert(schema.users).values({
        username: u.username,
        passwordHash,
        name: u.name,
        email: u.email,
        roleId: rolesMap[u.roleName],
        regionId: u.regionCode ? regionsMap[u.regionCode] : null,
        stationId: u.stationName ? stationsMap[u.stationName] : null,
      });
      usersMap[u.username] = inserted.insertId;
    } else {
      usersMap[u.username] = existing.id;
    }
  }
  console.log(`✅ Users seeded/loaded (password: password123)`);

  const officerId = usersMap['officer'];
  const auditorId = usersMap['auditor'];

  // 9. Assets
  const assetData = [
    {
      assetId: 'DVLA-IT-000001', name: 'HP ProBook 450 G8', categoryId: catsMap['IT'], subcategoryId: subcatsMap['LAP'],
      brand: 'HP', model: 'ProBook 450 G8', serialNumber: '5CD12345XYZ', regionId: regionsMap['GAR'],
      stationId: stationsMap['Accra Main (37)'], departmentId: deptsMap['IT & Technical Support'],
      assignedEmployeeId: empsMap['EMP-GAR-002'], acquisitionDate: new Date('2025-01-15'),
      lastVerificationDate: new Date('2026-04-10'), status: 'Active' as const,
    },
    {
      assetId: 'DVLA-IT-000002', name: 'Cisco Catalyst 2960-L', categoryId: catsMap['IT'], subcategoryId: subcatsMap['SWT'],
      brand: 'Cisco', model: '2960-L 24-Port', serialNumber: 'SN-CSCO-998877', regionId: regionsMap['GAR'],
      stationId: stationsMap['Accra Main (37)'], departmentId: deptsMap['IT & Technical Support'],
      acquisitionDate: new Date('2025-01-15'), lastVerificationDate: new Date('2026-04-10'), status: 'Active' as const,
    },
    {
      assetId: 'DVLA-FUR-000001', name: 'Ergonomic Mesh Chair', categoryId: catsMap['FUR'], subcategoryId: subcatsMap['CHA'],
      brand: 'Orthofit', model: 'Task-X', serialNumber: 'SN-ORTO-00192', regionId: regionsMap['ASH'],
      stationId: stationsMap['Kumasi Main'], departmentId: deptsMap['Administration'],
      assignedEmployeeId: empsMap['EMP-ASH-001'], acquisitionDate: new Date('2025-03-10'),
      lastVerificationDate: new Date('2026-05-15'), status: 'Active' as const,
    },
    {
      assetId: 'DVLA-VEH-000001', name: 'Toyota Hilux Double Cabin', categoryId: catsMap['VEH'], subcategoryId: subcatsMap['PIC'],
      brand: 'Toyota', model: 'Hilux 2.4L D-4D', serialNumber: 'ENG-TOY-8849201', regionId: regionsMap['WES'],
      stationId: stationsMap['Takoradi'], departmentId: deptsMap['Operations & Security'],
      assignedEmployeeId: empsMap['EMP-WES-001'], acquisitionDate: new Date('2024-06-01'),
      lastVerificationDate: new Date('2026-03-20'), status: 'Active' as const,
    },
    {
      assetId: 'DVLA-ELE-000001', name: '150kVA Cummins Generator', categoryId: catsMap['ELE'], subcategoryId: subcatsMap['GEN'],
      brand: 'Cummins', model: 'C150D5', serialNumber: 'SN-CUMM-77332', regionId: regionsMap['GAR'],
      stationId: stationsMap['Accra Main (37)'], departmentId: deptsMap['Operations & Security'],
      acquisitionDate: new Date('2023-11-20'), lastVerificationDate: new Date('2026-01-10'), status: 'Active' as const,
    },
    {
      assetId: 'DVLA-SEC-000001', name: 'Hikvision IP Dome Camera', categoryId: catsMap['SEC'], subcategoryId: subcatsMap['CCT'],
      brand: 'Hikvision', model: 'DS-2CD2143G0', serialNumber: 'SN-HIK-554422', regionId: regionsMap['GAR'],
      stationId: stationsMap['Tema'], departmentId: deptsMap['Licensing'],
      status: 'Under_Maintenance' as const, acquisitionDate: new Date('2025-07-15'),
      lastVerificationDate: new Date('2026-05-20'),
    },
    {
      assetId: 'DVLA-IT-000003', name: 'Dell OptiPlex 7090 Desktop', categoryId: catsMap['IT'], subcategoryId: subcatsMap['DES'],
      brand: 'Dell', model: 'OptiPlex 7090', serialNumber: 'SN-DELL-88371', regionId: regionsMap['GAR'],
      stationId: stationsMap['Tema'], departmentId: deptsMap['Licensing'],
      status: 'Damaged' as const, acquisitionDate: new Date('2025-02-10'),
      lastVerificationDate: new Date('2026-05-22'),
    },
    {
      assetId: 'DVLA-IT-000004', name: 'Lenovo ThinkPad X1 Carbon', categoryId: catsMap['IT'], subcategoryId: subcatsMap['LAP'],
      brand: 'Lenovo', model: 'X1 Carbon Gen 9', serialNumber: 'SN-LEN-9922881', regionId: regionsMap['GAR'],
      stationId: stationsMap['Accra Main (37)'], departmentId: deptsMap['Audit'],
      status: 'Missing' as const, acquisitionDate: new Date('2025-05-15'),
      lastVerificationDate: new Date('2026-04-12'),
    },
  ];

  for (const a of assetData) {
    const existing = await db.query.assets.findFirst({
      where: eq(schema.assets.assetId, a.assetId),
    });
    if (!existing) {
      await db.insert(schema.assets).values(a);
      await db.insert(schema.assetHistory).values({
        assetId: a.assetId,
        actionType: 'Created',
        description: 'Asset registered in system',
        userId: officerId,
      });
    }
  }
  console.log(`✅ Sample Assets seeded/loaded`);

  // 10. Sample Transfer
  const transfer = await db.query.assetTransfers.findFirst();
  if (!transfer) {
    await db.insert(schema.assetTransfers).values({
      assetId: 'DVLA-SEC-000001',
      fromRegionId: regionsMap['GAR'],
      toRegionId: regionsMap['GAR'],
      fromStationId: stationsMap['Accra Main (37)'],
      toStationId: stationsMap['Tema'],
      fromDepartmentId: deptsMap['Operations & Security'],
      toDepartmentId: deptsMap['Licensing'],
      reason: 'Transferred to Tema station for active surveillance installation',
      transferredByUserId: officerId,
    });
  }

  // 11. Sample Verifications
  const verification = await db.query.assetVerifications.findFirst();
  if (!verification) {
    await db.insert(schema.assetVerifications).values([
      { assetId: 'DVLA-IT-000001', verificationType: 'Quarterly', status: 'Verified', comments: 'Working perfectly', verifiedByUserId: auditorId },
      { assetId: 'DVLA-IT-000004', verificationType: 'Annual', status: 'Missing', comments: 'Not found at desk location', verifiedByUserId: auditorId },
      { assetId: 'DVLA-IT-000003', verificationType: 'Quarterly', status: 'Damaged', comments: 'Motherboard failure due to power surge', verifiedByUserId: officerId },
    ]);
  }

  // 12. Notifications
  const notification = await db.query.notifications.findFirst();
  if (!notification) {
    await db.insert(schema.notifications).values([
      { type: 'AssetTransferred', message: 'Hikvision Camera (DVLA-SEC-000001) transferred to Tema Station', assetId: 'DVLA-SEC-000001' },
      { type: 'AssetMissing', message: 'Lenovo ThinkPad (DVLA-IT-000004) reported Missing during annual audit', assetId: 'DVLA-IT-000004' },
      { type: 'VerificationOverdue', message: 'Verification overdue for Winneba Station assets' },
    ]);
  }

  // 13. Audit Logs
  const audit = await db.query.auditLogs.findFirst();
  if (!audit) {
    await db.insert(schema.auditLogs).values([
      { action: 'Login Success', userId: usersMap['admin'], ipAddress: '192.168.1.10', affectedRecord: 'User: admin' },
      { action: 'Registered Asset', userId: officerId, ipAddress: '192.168.1.12', affectedRecord: 'DVLA-IT-000001' },
      { action: 'Transferred Asset', userId: officerId, ipAddress: '192.168.1.12', affectedRecord: 'DVLA-SEC-000001' },
      { action: 'Verified Asset', userId: auditorId, ipAddress: '192.168.1.15', affectedRecord: 'DVLA-IT-000004 - Missing' },
    ]);
  }

  console.log('✅ Seed complete!');
}

main()
  .then(() => {
    console.log('Finished seeding.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });
