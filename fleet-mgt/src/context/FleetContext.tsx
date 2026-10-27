'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Vehicle, MaintenanceLog, FuelLog, Station, AssignmentLog, Driver, CMSData } from '../types/fleet';
import { STATIONS, INITIAL_VEHICLES, INITIAL_MAINTENANCE_LOGS, INITIAL_FUEL_LOGS, INITIAL_ASSIGNMENT_LOGS, INITIAL_DRIVERS, DEFAULT_CMS_DATA } from '../data/mockFleetData';

export interface SystemSettings {
  roadWorthyThreshold: number; // in days
  insuranceThreshold: number; // in days
  serviceReminderThreshold: number; // in days
  serviceMonthsThreshold: number; // default 3 (months)
  serviceMileageThreshold: number; // default 5000 (km)
  adminName: string;
  adminBranch: string;
  fuelPricePerLiter: number; // in GHS
}

interface FleetContextType {
  vehicles: Vehicle[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  assignmentLogs: AssignmentLog[];
  stations: Station[];
  systemSettings: SystemSettings;
  drivers: Driver[];
  cmsData: CMSData;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  addMaintenance: (log: MaintenanceLog) => void;
  resolveMaintenance: (logId: string, actualCost: number, partsReplaced: string[], otherWorkDone?: string) => void;
  renewRoadWorthy: (vehicleId: string, newDate: string, log: MaintenanceLog) => void;
  renewInsurance: (vehicleId: string, newDate: string, policyNumber: string, company: string) => void;
  addFuel: (log: FuelLog) => void;
  reassignVehicle: (vehicleId: string, stationId: string, driver: string) => void;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  addStation: (station: Station) => void;
  updateStation: (station: Station) => void;
  deleteStation: (stationId: string) => void;
  addDriver: (driver: Driver) => void;
  updateDriver: (driver: Driver) => void;
  deleteDriver: (id: string) => void;
  addCMSItem: (category: keyof CMSData, item: string) => void;
  deleteCMSItem: (category: keyof CMSData, item: string) => void;
  resetDatabase: () => void;
  simulateFleetTravel: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(INITIAL_MAINTENANCE_LOGS);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(INITIAL_FUEL_LOGS);
  const [assignmentLogs, setAssignmentLogs] = useState<AssignmentLog[]>(INITIAL_ASSIGNMENT_LOGS);
  const [stations, setStations] = useState<Station[]>(STATIONS);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [cmsData, setCmsData] = useState<CMSData>(DEFAULT_CMS_DATA);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('fleet-theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setTheme(storedTheme);
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('fleet-theme', nextTheme);
      }
      return nextTheme;
    });
  }, []);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    roadWorthyThreshold: 30,
    insuranceThreshold: 30,
    serviceReminderThreshold: 14,
    serviceMonthsThreshold: 3,
    serviceMileageThreshold: 5000,
    adminName: "System Admin",
    adminBranch: "DVLA Headquarters",
    fuelPricePerLiter: 15
  });

  const addVehicle = useCallback((newVehicle: Vehicle) => {
    setVehicles(prev => [...prev, newVehicle]);
    const newLog: AssignmentLog = {
      id: `a-${Date.now()}`,
      vehicleId: newVehicle.id,
      date: '2026-06-12',
      driverName: newVehicle.currentDriver || 'Unassigned',
      stationId: newVehicle.stationId,
      notes: 'Initial vehicle registration in system.'
    };
    setAssignmentLogs(lPrev => [newLog, ...lPrev]);
  }, []);

  const updateVehicle = useCallback((updatedVehicle: Vehicle) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === updatedVehicle.id) {
        if (v.currentDriver !== updatedVehicle.currentDriver || v.stationId !== updatedVehicle.stationId) {
          const newLog: AssignmentLog = {
            id: `a-${Date.now()}`,
            vehicleId: v.id,
            date: '2026-06-12',
            driverName: updatedVehicle.currentDriver || 'Unassigned',
            stationId: updatedVehicle.stationId,
            notes: `Profile updated. Changed operator from "${v.currentDriver}" to "${updatedVehicle.currentDriver || 'Unassigned'}".`
          };
          setAssignmentLogs(lPrev => [newLog, ...lPrev]);
        }
        return updatedVehicle;
      }
      return v;
    }));
  }, []);

  const deleteVehicle = useCallback((id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  const addMaintenance = useCallback((newLog: MaintenanceLog) => {
    setMaintenanceLogs(prev => [newLog, ...prev]);
    if (newLog.status === 'Completed') {
      setVehicles(prev => prev.map(v => {
        if (v.id === newLog.vehicleId) {
          return {
            ...v,
            status: (v.status === 'Maintenance' || v.status === 'Out of Service') ? 'Active' : v.status,
            lastServiceDate: newLog.serviceDate,
            lastServiceMileage: newLog.odometerReading || v.lastServiceMileage
          };
        }
        return v;
      }));
    }
  }, []);

  const resolveMaintenance = useCallback((logId: string, actualCost: number, partsReplaced: string[], otherWorkDone?: string) => {
    setMaintenanceLogs(prev => prev.map(l => {
      if (l.id === logId) {
        const updatedDate = '2026-06-12';
        setVehicles(vPrev => vPrev.map(v => {
          if (v.id === l.vehicleId) {
            return { 
              ...v, 
              status: (v.status === 'Maintenance' || v.status === 'Out of Service') ? 'Active' : v.status,
              lastServiceDate: updatedDate
            };
          }
          return v;
        }));
        return {
          ...l,
          cost: actualCost,
          status: 'Completed',
          partsReplaced,
          otherWorkDone: otherWorkDone || l.otherWorkDone,
          serviceDate: updatedDate
        };
      }
      return l;
    }));
  }, []);

  const renewRoadWorthy = useCallback((vehicleId: string, newDate: string, log: MaintenanceLog) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, roadWorthyExpiry: newDate } : v));
    setMaintenanceLogs(prev => [log, ...prev]);
  }, []);

  const renewInsurance = useCallback((vehicleId: string, newDate: string, policyNumber: string, company: string) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? {
      ...v,
      insuranceExpiryDate: newDate,
      insurancePolicyNumber: policyNumber || v.insurancePolicyNumber,
      insuranceCompany: company || v.insuranceCompany
    } : v));
  }, []);

  const addFuel = useCallback((newLog: FuelLog) => {
    setFuelLogs(prev => [newLog, ...prev]);
  }, []);

  const reassignVehicle = useCallback((vehicleId: string, stationId: string, driver: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const newLog: AssignmentLog = {
          id: `a-${Date.now()}`,
          vehicleId,
          date: '2026-06-12',
          driverName: driver || 'Unassigned',
          stationId,
          notes: `Quick Dispatch. Assigned driver "${driver || 'Unassigned'}" at station depot.`
        };
        setAssignmentLogs(lPrev => [newLog, ...lPrev]);
        return {
          ...v,
          stationId,
          currentDriver: driver || 'Unassigned'
        };
      }
      return v;
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const addStation = useCallback((newStation: Station) => {
    setStations(prev => [...prev, newStation]);
  }, []);

  const updateStation = useCallback((updatedStation: Station) => {
    setStations(prev => prev.map(s => s.id === updatedStation.id ? updatedStation : s));
  }, []);

  const deleteStation = useCallback((stationId: string) => {
    setStations(prev => prev.filter(s => s.id !== stationId));
  }, []);

  const addDriver = useCallback((newDriver: Driver) => {
    setDrivers(prev => [...prev, newDriver]);
  }, []);

  const updateDriver = useCallback((updatedDriver: Driver) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === updatedDriver.id) {
        if (d.name !== updatedDriver.name) {
          setVehicles(vPrev => vPrev.map(v => {
            if (v.currentDriver === d.name) {
              return { ...v, currentDriver: updatedDriver.name };
            }
            return v;
          }));
        }
        return updatedDriver;
      }
      return d;
    }));
  }, []);

  const deleteDriver = useCallback((id: string) => {
    setDrivers(prev => {
      const driverToDelete = prev.find(d => d.id === id);
      if (driverToDelete) {
        setVehicles(vPrev => vPrev.map(v => {
          if (v.currentDriver === driverToDelete.name) {
            return { ...v, currentDriver: 'Unassigned' };
          }
          return v;
        }));
      }
      return prev.filter(d => d.id !== id);
    });
  }, []);

  const addCMSItem = useCallback((category: keyof CMSData, item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    setCmsData(prev => {
      if (prev[category].includes(trimmed)) return prev;
      return {
        ...prev,
        [category]: [...prev[category], trimmed]
      };
    });
  }, []);

  const deleteCMSItem = useCallback((category: keyof CMSData, item: string) => {
    setCmsData(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
  }, []);

  const resetDatabase = useCallback(() => {
    setVehicles(INITIAL_VEHICLES);
    setMaintenanceLogs(INITIAL_MAINTENANCE_LOGS);
    setFuelLogs(INITIAL_FUEL_LOGS);
    setAssignmentLogs(INITIAL_ASSIGNMENT_LOGS);
    setStations(STATIONS);
    setDrivers(INITIAL_DRIVERS);
    setCmsData(DEFAULT_CMS_DATA);

    setSystemSettings({
      roadWorthyThreshold: 30,
      insuranceThreshold: 30,
      serviceReminderThreshold: 14,
      serviceMonthsThreshold: 3,
      serviceMileageThreshold: 5000,
      adminName: "System Admin",
      adminBranch: "DVLA Headquarters",
      fuelPricePerLiter: 15
    });
    alert('Database reset successful. All values restored to initial seeds.');
  }, []);

  const simulateFleetTravel = useCallback(() => {
    const activeUnits = vehicles.filter(v => v.status === 'Active' || v.status === 'In Service');
    if (activeUnits.length === 0) {
      alert('Simulation Aborted: No active vehicles in service.');
      return;
    }
    
    const shuffled = [...activeUnits].sort(() => 0.5 - Math.random());
    const targets = shuffled.slice(0, Math.min(2, shuffled.length));
    
    targets.forEach(v => {
      const vLogs = fuelLogs.filter(f => f.vehicleId === v.id);
      const sorted = [...vLogs].sort((a,b) => b.odometerReading - a.odometerReading);
      const currentOdo = sorted.length > 0 ? sorted[0].odometerReading : v.baseMileage;
      
      const distance = Math.floor(Math.random() * 120) + 60;
      const newOdo = currentOdo + distance;
      const liters = Math.round((distance * (10 / 100)) * 10) / 10;
      const cost = Math.round(liters * systemSettings.fuelPricePerLiter);
      
      const newFuelLog: FuelLog = {
        id: `f-sim-${Date.now()}-${v.id}`,
        vehicleId: v.id,
        date: '2026-06-12',
        liters,
        cost,
        odometerReading: newOdo
      };
      
      setFuelLogs(prev => [newFuelLog, ...prev]);
    });
    alert('Simulated fleet travel successfully logged. Check Fuel Tracking logs or individual reports to see updated distances!');
  }, [vehicles, fuelLogs, systemSettings.fuelPricePerLiter]);

  return (
    <FleetContext.Provider value={{
      vehicles,
      maintenanceLogs,
      fuelLogs,
      assignmentLogs,
      stations,
      systemSettings,
      drivers,
      cmsData,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addMaintenance,
      resolveMaintenance,
      renewRoadWorthy,
      renewInsurance,
      addFuel,
      reassignVehicle,
      updateSettings,
      addStation,
      updateStation,
      deleteStation,
      addDriver,
      updateDriver,
      deleteDriver,
      addCMSItem,
      deleteCMSItem,
      resetDatabase,
      simulateFleetTravel,
      theme,
      toggleTheme
    }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
}
