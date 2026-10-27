export type VehicleStatus = 'Active' | 'In Service' | 'Maintenance' | 'Out of Service';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  email: string;
  licenseClass: string; // e.g., 'Class A', 'Class B', 'Class C', 'Class D', 'Class E', 'Class F'
  stationId: string; // references Station.id
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  chassisNumber: string;
  make: string;
  model: string;
  yearOfManufacture: number;
  yearOfPurchase: number;
  designation: string; // e.g., 'Pool Vehicle', 'Executive', 'Staff Transport', 'Operational', etc.
  status: VehicleStatus;
  roadWorthyExpiry: string; // ISO date string (YYYY-MM-DD)
  stationId: string; // references Station.id
  currentDriver: string;
  baseMileage: number; // mileage of vehicle when registered
  fuelCapacity: number; // in liters
  insuranceCompany: string; // one of 5 DVLA partners or custom
  insurancePolicyNumber: string;
  insuranceExpiryDate: string; // ISO date string YYYY-MM-DD
  lastServiceDate: string; // ISO date string YYYY-MM-DD
  lastServiceMileage: number; // odometer reading at last service
}

export interface Station {
  id: string;
  name: string;
  location: string;
  code: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceDate: string; // YYYY-MM-DD
  serviceType: string; // e.g., 'Air Condition Service', 'Engine Oil Change', etc.
  cost: number;
  notes: string;
  status: 'Pending' | 'Completed';
  partsReplaced: string[];
  otherWorkDone?: string;
  odometerReading?: number;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  liters: number;
  cost: number;
  odometerReading: number; // total mileage at fill-up
}

export interface PartCount {
  partName: string;
  count: number;
}

export interface AssignmentLog {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  driverName: string;
  stationId: string;
  notes?: string;
}

export interface CMSData {
  insuranceCompanies: string[];
  vehicleDesignations: string[];
  licenseClasses: string[];
  serviceTypes: string[];
}
