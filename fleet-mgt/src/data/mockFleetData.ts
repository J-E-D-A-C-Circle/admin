import { Station, Vehicle, MaintenanceLog, FuelLog, AssignmentLog, Driver, CMSData } from '../types/fleet';

export const DEFAULT_CMS_DATA: CMSData = {
  insuranceCompanies: [
    'Enterprise Insurance Co. Ltd',
    'SIC Insurance PLC',
    'Star Assurance Co. Ltd',
    'Vanguard Assurance Co. Ltd',
    'Glico General Insurance Ltd'
  ],
  vehicleDesignations: [
    'Pool Vehicle',
    'Executive Transport',
    'Staff Bus / Transport',
    'Operational / Patrol Unit',
    'Utility / Field Operations',
    'Ambulance / Emergency Unit'
  ],
  licenseClasses: [
    'Class A',
    'Class B',
    'Class C',
    'Class D',
    'Class E',
    'Class F'
  ],
  serviceTypes: [
    'Air Condition Service',
    'Engine Oil Change',
    'Brake Pad Replacement',
    'Tire Replacement',
    'Battery Replacement',
    'Air Filter Check',
    'Suspension Overhaul',
    'Wheel Alignment & Balance',
    'Oxygen Sensor Replacement',
    'Scheduled Inspection & Repair'
  ]
};

export const STATIONS: Station[] = [
  { id: 'accra', name: 'Accra Central Hub', location: 'Greater Accra', code: 'ACC-01' },
  { id: 'kumasi', name: 'Kumasi Regional Station', location: 'Ashanti Region', code: 'KMS-02' },
  { id: 'tema', name: 'Tema Port Transit Station', location: 'Greater Accra', code: 'TMA-03' },
  { id: 'takoradi', name: 'Takoradi Harbor Depot', location: 'Western Region', code: 'TKD-04' }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: '1',
    plateNumber: 'GP-201-22',
    chassisNumber: 'AHTX12E99002130',
    make: 'Toyota',
    model: 'Hilux Double Cabin',
    yearOfManufacture: 2021,
    yearOfPurchase: 2022,
    designation: 'Operational / Patrol Unit',
    status: 'Active',
    roadWorthyExpiry: '2026-09-15',
    stationId: 'accra',
    currentDriver: 'Emmanuel Osei',
    baseMileage: 42000,
    fuelCapacity: 80,
    insuranceCompany: 'Enterprise Insurance Co. Ltd',
    insurancePolicyNumber: 'POL-ENT-9021-2025',
    insuranceExpiryDate: '2026-10-15',
    lastServiceDate: '2026-05-12',
    lastServiceMileage: 43500
  },
  {
    id: '2',
    plateNumber: 'GV-405-20',
    chassisNumber: 'JN8AZ01D0092305',
    make: 'Nissan',
    model: 'Patrol SUV',
    yearOfManufacture: 2019,
    yearOfPurchase: 2020,
    designation: 'Executive Transport',
    status: 'In Service',
    roadWorthyExpiry: '2026-05-10', // EXPIRED
    stationId: 'kumasi',
    currentDriver: 'Kofi Mensah',
    baseMileage: 78000,
    fuelCapacity: 95,
    insuranceCompany: 'SIC Insurance PLC',
    insurancePolicyNumber: 'POL-SIC-8812-2025',
    insuranceExpiryDate: '2026-06-01', // EXPIRED insurance alert
    lastServiceDate: '2026-02-15', // Over 3 months ago!
    lastServiceMileage: 75000 // 6,140 km driven since last service (over 5000 threshold!)
  },
  {
    id: '3',
    plateNumber: 'GP-880-23',
    chassisNumber: '1FTFW1E80552019',
    make: 'Ford',
    model: 'Ranger Wildtrak',
    yearOfManufacture: 2022,
    yearOfPurchase: 2023,
    designation: 'Utility / Field Operations',
    status: 'Maintenance',
    roadWorthyExpiry: '2026-06-30', // EXPIRING SOON
    stationId: 'tema',
    currentDriver: 'Kwame Owusu',
    baseMileage: 25000,
    fuelCapacity: 80,
    insuranceCompany: 'Star Assurance Co. Ltd',
    insurancePolicyNumber: 'POL-STA-5541-2025',
    insuranceExpiryDate: '2026-07-10', // Insurance expiring soon
    lastServiceDate: '2026-06-02',
    lastServiceMileage: 26150
  },
  {
    id: '4',
    plateNumber: 'GV-112-21',
    chassisNumber: 'JTDKB20U0018873',
    make: 'Toyota',
    model: 'HiAce Ambulance',
    yearOfManufacture: 2020,
    yearOfPurchase: 2021,
    designation: 'Ambulance / Emergency Unit',
    status: 'Active',
    roadWorthyExpiry: '2026-11-20',
    stationId: 'takoradi',
    currentDriver: 'Yaw Boateng',
    baseMileage: 105000,
    fuelCapacity: 70,
    insuranceCompany: 'Vanguard Assurance Co. Ltd',
    insurancePolicyNumber: 'POL-VNG-1129-2025',
    insuranceExpiryDate: '2026-11-15',
    lastServiceDate: '2026-03-20',
    lastServiceMileage: 104000
  },
  {
    id: '5',
    plateNumber: 'GP-701-19',
    chassisNumber: 'MMBJRKB40034291',
    make: 'Mitsubishi',
    model: 'L200 Pick-Up',
    yearOfManufacture: 2018,
    yearOfPurchase: 2019,
    designation: 'Pool Vehicle',
    status: 'Out of Service',
    roadWorthyExpiry: '2026-03-01', // EXPIRED
    stationId: 'accra',
    currentDriver: 'Unassigned (In Shop)',
    baseMileage: 142000,
    fuelCapacity: 75,
    insuranceCompany: 'Glico General Insurance Ltd',
    insurancePolicyNumber: 'POL-GLI-3302-2025',
    insuranceExpiryDate: '2026-04-10', // EXPIRED insurance
    lastServiceDate: '2025-11-10',
    lastServiceMileage: 135000
  },
  {
    id: '6',
    plateNumber: 'GV-220-22',
    chassisNumber: 'AHTX12E99003890',
    make: 'Toyota',
    model: 'Hilux Single Cabin',
    yearOfManufacture: 2021,
    yearOfPurchase: 2022,
    designation: 'Utility / Field Operations',
    status: 'Active',
    roadWorthyExpiry: '2026-12-10',
    stationId: 'accra',
    currentDriver: 'Andrews Addo',
    baseMileage: 53000,
    fuelCapacity: 80,
    insuranceCompany: 'Enterprise Insurance Co. Ltd',
    insurancePolicyNumber: 'POL-ENT-7782-2025',
    insuranceExpiryDate: '2026-12-05',
    lastServiceDate: '2026-05-25',
    lastServiceMileage: 54000
  },
  {
    id: '7',
    plateNumber: 'GP-315-21',
    chassisNumber: 'KMHDH4AE9001150',
    make: 'Hyundai',
    model: 'Elantra Sedan',
    yearOfManufacture: 2020,
    yearOfPurchase: 2021,
    designation: 'Staff Bus / Transport',
    status: 'Active',
    roadWorthyExpiry: '2026-07-05', // EXPIRING SOON
    stationId: 'kumasi',
    currentDriver: 'Amma Serwaa',
    baseMileage: 61000,
    fuelCapacity: 50,
    insuranceCompany: 'SIC Insurance PLC',
    insurancePolicyNumber: 'POL-SIC-9910-2025',
    insuranceExpiryDate: '2026-07-02',
    lastServiceDate: '2026-06-08',
    lastServiceMileage: 62280
  },
  {
    id: '8',
    plateNumber: 'GV-504-23',
    chassisNumber: 'KNEFN22D0089201',
    make: 'Kia',
    model: 'K2500 Light Truck',
    yearOfManufacture: 2022,
    yearOfPurchase: 2023,
    designation: 'Utility / Field Operations',
    status: 'Active',
    roadWorthyExpiry: '2026-09-18',
    stationId: 'tema',
    currentDriver: 'Ebenezer Tetteh',
    baseMileage: 38000,
    fuelCapacity: 65,
    insuranceCompany: 'Star Assurance Co. Ltd',
    insurancePolicyNumber: 'POL-STA-4491-2025',
    insuranceExpiryDate: '2026-09-10',
    lastServiceDate: '2026-04-10',
    lastServiceMileage: 36500
  }
];

export const INITIAL_MAINTENANCE_LOGS: MaintenanceLog[] = [
  {
    id: 'm1',
    vehicleId: '1',
    serviceDate: '2026-05-12',
    serviceType: 'Engine Oil Change',
    cost: 480,
    notes: 'Standard synthetic oil replacement and oil filter check.',
    status: 'Completed',
    partsReplaced: ['Engine Oil', 'Oil Filter'],
    otherWorkDone: 'Checked tire pressure and refilled windshield fluid.'
  },
  {
    id: 'm2',
    vehicleId: '1',
    serviceDate: '2026-05-12',
    serviceType: 'Air Condition Service',
    cost: 650,
    notes: 'Flushed AC refrigerant gas and replaced cabin pollen filter.',
    status: 'Completed',
    partsReplaced: ['Cabin AC Filter'],
    otherWorkDone: 'Sanitized ventilation ductwork.'
  },
  {
    id: 'm3',
    vehicleId: '2',
    serviceDate: '2026-04-18',
    serviceType: 'Brake Pad Replacement',
    cost: 550,
    notes: 'Front brake pads were completely worn out. Installed heavy-duty ceramics.',
    status: 'Completed',
    partsReplaced: ['Brakes']
  },
  {
    id: 'm4',
    vehicleId: '2',
    serviceDate: '2026-04-18',
    serviceType: 'Battery Replacement',
    cost: 950,
    notes: 'Replaced failing lead-acid battery with new maintenance-free Varta battery.',
    status: 'Completed',
    partsReplaced: ['Battery']
  },
  {
    id: 'm5',
    vehicleId: '3',
    serviceDate: '2026-06-02',
    serviceType: 'Air Filter Check',
    cost: 150,
    notes: 'Cleaned cabin filter and replaced primary engine air filter.',
    status: 'Completed',
    partsReplaced: ['Air Filter']
  },
  {
    id: 'm6',
    vehicleId: '3',
    serviceDate: '2026-06-25',
    serviceType: 'Scheduled Inspection & Repair',
    cost: 1200,
    notes: 'Transmission fluid flush and check minor oil leak.',
    status: 'Pending',
    partsReplaced: []
  },
  {
    id: 'm7',
    vehicleId: '4',
    serviceDate: '2026-03-20',
    serviceType: 'Oxygen Sensor Replacement',
    cost: 650,
    notes: 'Solved Check Engine Light issue by swapping sensor 1.',
    status: 'Completed',
    partsReplaced: ['Oxygen Sensor']
  },
  {
    id: 'm8',
    vehicleId: '5',
    serviceDate: '2026-05-30',
    serviceType: 'Suspension Overhaul',
    cost: 3200,
    notes: 'Rebuild rear leaf springs and swap shock absorbers. Overdue repair.',
    status: 'Pending',
    partsReplaced: []
  },
  {
    id: 'm9',
    vehicleId: '6',
    serviceDate: '2026-05-25',
    serviceType: 'Air Condition Service',
    cost: 500,
    notes: 'Recharged compressor gas and replaced AC belt.',
    status: 'Completed',
    partsReplaced: ['AC Compressor Belt']
  },
  {
    id: 'm10',
    vehicleId: '7',
    serviceDate: '2026-06-08',
    serviceType: 'Wheel Alignment & Balance',
    cost: 250,
    notes: 'Adjusted alignment after driver reported slight pull to the left.',
    status: 'Completed',
    partsReplaced: []
  }
];

export const INITIAL_FUEL_LOGS: FuelLog[] = [
  // GP-201-22 (Vehicle 1)
  { id: 'f1', vehicleId: '1', date: '2026-04-05', liters: 70, cost: 1050, odometerReading: 42350 },
  { id: 'f2', vehicleId: '1', date: '2026-04-22', liters: 68, cost: 1020, odometerReading: 42920 },
  { id: 'f3', vehicleId: '1', date: '2026-05-08', liters: 72, cost: 1080, odometerReading: 43510 },
  { id: 'f4', vehicleId: '1', date: '2026-05-24', liters: 70, cost: 1050, odometerReading: 44095 },
  { id: 'f5', vehicleId: '1', date: '2026-06-05', liters: 75, cost: 1125, odometerReading: 44715 },

  // GV-405-20 (Vehicle 2)
  { id: 'f6', vehicleId: '2', date: '2026-04-10', liters: 85, cost: 1275, odometerReading: 78500 },
  { id: 'f7', vehicleId: '2', date: '2026-04-28', liters: 80, cost: 1200, odometerReading: 79150 },
  { id: 'f8', vehicleId: '2', date: '2026-05-12', liters: 88, cost: 1320, odometerReading: 79850 },
  { id: 'f9', vehicleId: '2', date: '2026-05-30', liters: 82, cost: 1230, odometerReading: 80480 },
  { id: 'f10', vehicleId: '2', date: '2026-06-09', liters: 85, cost: 1275, odometerReading: 81140 },

  // GP-880-23 (Vehicle 3)
  { id: 'f11', vehicleId: '3', date: '2026-05-01', liters: 65, cost: 975, odometerReading: 25100 },
  { id: 'f12', vehicleId: '3', date: '2026-05-18', liters: 62, cost: 930, odometerReading: 25620 },
  { id: 'f13', vehicleId: '3', date: '2026-06-01', liters: 64, cost: 960, odometerReading: 26150 },

  // GV-112-21 (Vehicle 4)
  { id: 'f14', vehicleId: '4', date: '2026-04-12', liters: 60, cost: 900, odometerReading: 105400 },
  { id: 'f15', vehicleId: '4', date: '2026-05-02', liters: 58, cost: 870, odometerReading: 105950 },
  { id: 'f16', vehicleId: '4', date: '2026-05-20', liters: 62, cost: 930, odometerReading: 106520 },
  { id: 'f17', vehicleId: '4', date: '2026-06-07', liters: 60, cost: 900, odometerReading: 107080 },

  // GV-220-22 (Vehicle 6)
  { id: 'f18', vehicleId: '6', date: '2026-04-15', liters: 68, cost: 1020, odometerReading: 53500 },
  { id: 'f19', vehicleId: '6', date: '2026-05-10', liters: 72, cost: 1080, odometerReading: 54100 },
  { id: 'f20', vehicleId: '6', date: '2026-06-01', liters: 70, cost: 1050, odometerReading: 54680 },

  // GP-315-21 (Vehicle 7)
  { id: 'f21', vehicleId: '7', date: '2026-04-20', liters: 40, cost: 600, odometerReading: 61350 },
  { id: 'f22', vehicleId: '7', date: '2026-05-15', liters: 42, cost: 630, odometerReading: 61820 },
  { id: 'f23', vehicleId: '7', date: '2026-06-02', liters: 41, cost: 615, odometerReading: 62280 }
];

export const INITIAL_ASSIGNMENT_LOGS: AssignmentLog[] = [
  { id: 'a1', vehicleId: '1', date: '2026-05-10', driverName: 'Emmanuel Osei', stationId: 'accra', notes: 'Initial registry allocation.' },
  { id: 'a2', vehicleId: '2', date: '2026-05-12', driverName: 'Kofi Mensah', stationId: 'kumasi', notes: 'Initial registry allocation.' },
  { id: 'a3', vehicleId: '3', date: '2026-05-15', driverName: 'Kwame Owusu', stationId: 'tema', notes: 'Initial registry allocation.' },
  { id: 'a4', vehicleId: '4', date: '2026-05-18', driverName: 'Yaw Boateng', stationId: 'takoradi', notes: 'Initial registry allocation.' },
  { id: 'a5', vehicleId: '5', date: '2026-05-20', driverName: 'Unassigned (In Shop)', stationId: 'accra', notes: 'Initial registry allocation.' },
  { id: 'a6', vehicleId: '6', date: '2026-05-22', driverName: 'Andrews Addo', stationId: 'accra', notes: 'Initial registry allocation.' },
  { id: 'a7', vehicleId: '7', date: '2026-05-25', driverName: 'Amma Serwaa', stationId: 'kumasi', notes: 'Initial registry allocation.' },
  { id: 'a8', vehicleId: '8', date: '2026-05-28', driverName: 'Ebenezer Tetteh', stationId: 'tema', notes: 'Initial registry allocation.' }
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Emmanuel Osei', licenseNumber: 'DL-2022091', phone: '0244112233', email: 'emmanuel@dvla.gov.gh', licenseClass: 'Class C', stationId: 'accra' },
  { id: 'd2', name: 'Kofi Mensah', licenseNumber: 'DL-2020188', phone: '0205889900', email: 'kofi.mensah@dvla.gov.gh', licenseClass: 'Class D', stationId: 'kumasi' },
  { id: 'd3', name: 'Kwame Owusu', licenseNumber: 'DL-2023012', phone: '0277884433', email: 'kowusu@dvla.gov.gh', licenseClass: 'Class C', stationId: 'tema' },
  { id: 'd4', name: 'Yaw Boateng', licenseNumber: 'DL-2021054', phone: '0555667788', email: 'yboateng@dvla.gov.gh', licenseClass: 'Class E', stationId: 'takoradi' },
  { id: 'd5', name: 'Andrews Addo', licenseNumber: 'DL-2022415', phone: '0243123456', email: 'a.addo@dvla.gov.gh', licenseClass: 'Class B', stationId: 'accra' },
  { id: 'd6', name: 'Amma Serwaa', licenseNumber: 'DL-2021889', phone: '0202998877', email: 'aserwaa@dvla.gov.gh', licenseClass: 'Class B', stationId: 'kumasi' },
  { id: 'd7', name: 'Ebenezer Tetteh', licenseNumber: 'DL-2023901', phone: '0544556677', email: 'etetteh@dvla.gov.gh', licenseClass: 'Class C', stationId: 'tema' }
];
