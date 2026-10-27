'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  X,
  Wrench,
  Clock,
  Calendar,
  FileSpreadsheet,
  Download,
  Upload,
  ShieldCheck
} from 'lucide-react';
import { useFleet } from '@/context/FleetContext';
import { Vehicle, VehicleStatus } from '@/types/fleet';
import Link from 'next/link';
import DriverSelect from '@/components/DriverSelect';

export default function VehiclesPage() {
  const { 
    vehicles, 
    stations, 
    cmsData,
    maintenanceLogs, 
    fuelLogs,
    addVehicle, 
    updateVehicle, 
    deleteVehicle 
  } = useFleet();

  // Active Detail Panels
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<Vehicle | null>(null);

  // Search & Filter States
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>('All');
  const [vehicleStationFilter, setVehicleStationFilter] = useState<string>('All');

  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({
    plateNumber: '',
    chassisNumber: '',
    make: '',
    model: '',
    yearOfManufacture: 2022,
    yearOfPurchase: 2023,
    designation: 'Operational / Patrol Unit',
    status: 'Active',
    roadWorthyExpiry: '2027-06-12',
    stationId: 'accra',
    currentDriver: '',
    baseMileage: 0,
    fuelCapacity: 80,
    insuranceCompany: cmsData.insuranceCompanies[0] || 'Enterprise Insurance Co. Ltd',
    insurancePolicyNumber: 'POL-ENT-0001',
    insuranceExpiryDate: '2027-06-12',
    lastServiceDate: '2026-06-12',
    lastServiceMileage: 0
  });

  const currentMockDateStr = '2026-06-12';
  
  const getDaysDifference = (dateStr: string) => {
    if (!dateStr) return 0;
    const target = new Date(dateStr);
    const current = new Date(currentMockDateStr);
    const diffTime = target.getTime() - current.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRoadWorthyRegDate = (expiryStr: string | undefined) => {
    if (!expiryStr) return '';
    try {
      const expDate = new Date(expiryStr + 'T00:00:00');
      if (isNaN(expDate.getTime())) return '';
      expDate.setFullYear(expDate.getFullYear() - 1);
      return expDate.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const getExpiryFromRegDate = (regDateStr: string) => {
    try {
      const regDate = new Date(regDateStr + 'T00:00:00');
      if (isNaN(regDate.getTime())) return '';
      regDate.setFullYear(regDate.getFullYear() + 1);
      return regDate.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Fuel & Mileage Analytics helper
  const getOdometerStats = (vId: string) => {
    const sortedAll = [...fuelLogs].filter(f => f.vehicleId === vId).sort((a,b) => a.odometerReading - b.odometerReading);
    const vehicle = vehicles.find(v => v.id === vId);
    
    if (sortedAll.length === 0) {
      return { currentOdometer: vehicle ? vehicle.baseMileage : 0 };
    }
    return { currentOdometer: sortedAll[sortedAll.length - 1].odometerReading };
  };

  // Aggregated part replacements counter
  const getPartReplacementCounts = (vehicleId: string) => {
    const counts: { [key: string]: number } = {};
    const filtered = maintenanceLogs.filter(log => log.vehicleId === vehicleId && log.status === 'Completed');
      
    filtered.forEach(log => {
      log.partsReplaced.forEach(part => {
        const cleanPart = part.trim();
        if (cleanPart) {
          counts[cleanPart] = (counts[cleanPart] || 0) + 1;
        }
      });
    });
    
    return Object.entries(counts)
      .map(([partName, count]) => ({ partName, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Full detailed part replacement log for history tables
  const getPartReplacementHistory = (vehicleId: string) => {
    const list: { serviceDate: string; serviceType: string; partName: string; cost: number; notes: string }[] = [];
    const filtered = maintenanceLogs.filter(log => log.vehicleId === vehicleId && log.status === 'Completed');
      
    filtered.forEach(log => {
      log.partsReplaced.forEach(part => {
        if (part.trim()) {
          list.push({
            serviceDate: log.serviceDate,
            serviceType: log.serviceType,
            partName: part,
            cost: log.cost / (log.partsReplaced.length || 1),
            notes: log.notes
          });
        }
      });
    });
    return list.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  };

  // Handle Save Vehicle
  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.plateNumber || !vehicleForm.make || !vehicleForm.model) return;
    
    if (editingVehicle) {
      updateVehicle({ ...editingVehicle, ...vehicleForm } as Vehicle);
      setEditingVehicle(null);
    } else {
      const newVehicle: Vehicle = {
        id: String(Date.now()),
        plateNumber: vehicleForm.plateNumber,
        chassisNumber: vehicleForm.chassisNumber || `CHS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        make: vehicleForm.make,
        model: vehicleForm.model,
        yearOfManufacture: Number(vehicleForm.yearOfManufacture) || 2022,
        yearOfPurchase: Number(vehicleForm.yearOfPurchase) || 2023,
        designation: vehicleForm.designation || cmsData.vehicleDesignations[0] || 'Operational Unit',
        status: vehicleForm.status as VehicleStatus,
        roadWorthyExpiry: vehicleForm.roadWorthyExpiry || '2027-06-12',
        stationId: vehicleForm.stationId || 'accra',
        currentDriver: vehicleForm.currentDriver || 'Unassigned',
        baseMileage: Number(vehicleForm.baseMileage) || 0,
        fuelCapacity: Number(vehicleForm.fuelCapacity) || 80,
        insuranceCompany: vehicleForm.insuranceCompany || cmsData.insuranceCompanies[0] || 'Enterprise Insurance Co. Ltd',
        insurancePolicyNumber: vehicleForm.insurancePolicyNumber || 'POL-ENT-0001',
        insuranceExpiryDate: vehicleForm.insuranceExpiryDate || '2027-06-12',
        lastServiceDate: vehicleForm.lastServiceDate || '2026-06-12',
        lastServiceMileage: Number(vehicleForm.baseMileage) || 0
      };
      addVehicle(newVehicle);
    }
    
    setIsAddVehicleOpen(false);
    // Reset form
    setVehicleForm({
      plateNumber: '',
      chassisNumber: '',
      make: '',
      model: '',
      yearOfManufacture: 2022,
      yearOfPurchase: 2023,
      designation: cmsData.vehicleDesignations[0] || 'Operational Unit',
      status: 'Active',
      roadWorthyExpiry: '2027-06-12',
      stationId: 'accra',
      currentDriver: '',
      baseMileage: 0,
      fuelCapacity: 80,
      insuranceCompany: cmsData.insuranceCompanies[0] || 'Enterprise Insurance Co. Ltd',
      insurancePolicyNumber: 'POL-ENT-0001',
      insuranceExpiryDate: '2027-06-12',
      lastServiceDate: '2026-06-12',
      lastServiceMileage: 0
    });
  };

  const handleEditVehicleClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm(vehicle);
    setIsAddVehicleOpen(true);
  };

  const handleDeleteVehicleClick = (id: string) => {
    if (confirm('Are you sure you want to retire this vehicle from the DVLA registry?')) {
      deleteVehicle(id);
      if (selectedVehicleDetail?.id === id) {
        setSelectedVehicleDetail(null);
      }
    }
  };

  // Filter list
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = v.plateNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                            (v.chassisNumber && v.chassisNumber.toLowerCase().includes(vehicleSearch.toLowerCase())) ||
                            v.make.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                            v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                            (v.designation && v.designation.toLowerCase().includes(vehicleSearch.toLowerCase())) ||
                            v.currentDriver.toLowerCase().includes(vehicleSearch.toLowerCase());
      const matchesStatus = vehicleStatusFilter === 'All' || v.status === vehicleStatusFilter;
      const matchesStation = vehicleStationFilter === 'All' || v.stationId === vehicleStationFilter;
      return matchesSearch && matchesStatus && matchesStation;
    });
  }, [vehicles, vehicleSearch, vehicleStatusFilter, vehicleStationFilter]);

  // Excel / CSV Export Handler
  const handleExportExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Plate Number,Chassis Number,Make,Model,Year of Manufacture,Year of Purchase,Designation,Station Depot,Current Driver,Insurance Company,Policy Number,Insurance Expiry,Status,Base Mileage (km),Fuel Capacity (L)\n';
    
    filteredVehicles.forEach(v => {
      const stationName = stations.find(s => s.id === v.stationId)?.name || v.stationId;
      csvContent += `"${v.plateNumber}","${v.chassisNumber || ''}","${v.make}","${v.model}",${v.yearOfManufacture || ''},${v.yearOfPurchase || ''},"${v.designation || ''}","${stationName}","${v.currentDriver}","${v.insuranceCompany || ''}","${v.insurancePolicyNumber || ''}","${v.insuranceExpiryDate || ''}","${v.status}",${v.baseMileage},${v.fuelCapacity}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DVLA_Fleet_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel / CSV Import Handler
  const handleProcessImportCsv = () => {
    if (!importCsvText.trim()) return;

    const lines = importCsvText.trim().split('\n');
    let importedCount = 0;

    lines.forEach((line, idx) => {
      // Skip header line if present
      if (idx === 0 && line.toLowerCase().includes('plate')) return;

      // Handle simple CSV splitting
      const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
      if (parts.length >= 3 && parts[0]) {
        const newV: Vehicle = {
          id: `imp-${Date.now()}-${idx}`,
          plateNumber: parts[0],
          chassisNumber: parts[1] || `CHS-IMP-${idx}`,
          make: parts[2] || 'Toyota',
          model: parts[3] || 'Hilux',
          yearOfManufacture: Number(parts[4]) || 2022,
          yearOfPurchase: Number(parts[5]) || 2023,
          designation: parts[6] || cmsData.vehicleDesignations[0] || 'Operational Unit',
          stationId: 'accra',
          currentDriver: parts[8] || 'Unassigned',
          insuranceCompany: parts[9] || cmsData.insuranceCompanies[0] || 'Enterprise Insurance Co. Ltd',
          insurancePolicyNumber: parts[10] || 'POL-IMP-001',
          insuranceExpiryDate: parts[11] || '2027-06-12',
          status: (parts[12] as VehicleStatus) || 'Active',
          baseMileage: Number(parts[13]) || 0,
          fuelCapacity: Number(parts[14]) || 80,
          roadWorthyExpiry: '2027-06-12',
          lastServiceDate: '2026-06-12',
          lastServiceMileage: Number(parts[13]) || 0
        };
        addVehicle(newV);
        importedCount++;
      }
    });

    alert(`Successfully imported ${importedCount} vehicle(s) into the registry!`);
    setIsImportModalOpen(false);
    setImportCsvText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* VIEW CONTAINER */}
      <div className="view-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="no-print">
          {/* SEARCH, FILTER AND ADD BAR */}
          <div className="glass-panel toolbar">
            <div className="search-filter-group">
              <div className="search-input-wrapper">
                <Search className="search-icon" style={{ height: '16px', width: '16px' }} />
                <input 
                  type="text" 
                  placeholder="Search plate, chassis, model, driver..." 
                  className="form-input"
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                />
              </div>
              
              <div className="filter-select-wrapper">
                <Filter style={{ height: '14px', width: '14px' }} />
                <select 
                  className="form-select"
                  style={{ fontSize: '0.75rem', width: '130px', padding: '8px 12px' }}
                  value={vehicleStatusFilter}
                  onChange={(e) => setVehicleStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="In Service">In Service</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>

              <select 
                className="form-select"
                style={{ fontSize: '0.75rem', width: '180px', padding: '8px 12px' }}
                value={vehicleStationFilter}
                onChange={(e) => setVehicleStationFilter(e.target.value)}
              >
                <option value="All">All Stations</option>
                {stations.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={handleExportExcel}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '8px 12px' }}
                title="Export list to Excel / CSV"
              >
                <Download style={{ height: '14px', width: '14px' }} />
                <span>Export Excel</span>
              </button>

              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '8px 12px' }}
                title="Import Excel / CSV data"
              >
                <Upload style={{ height: '14px', width: '14px' }} />
                <span>Import Excel</span>
              </button>

              <button 
                onClick={() => {
                  setEditingVehicle(null);
                  setVehicleForm({
                    plateNumber: '',
                    chassisNumber: '',
                    make: '',
                    model: '',
                    yearOfManufacture: 2022,
                    yearOfPurchase: 2023,
                    designation: cmsData.vehicleDesignations[0] || 'Operational Unit',
                    status: 'Active',
                    roadWorthyExpiry: '2027-06-12',
                    stationId: stations[0]?.id || 'accra',
                    currentDriver: '',
                    baseMileage: 0,
                    fuelCapacity: 80,
                    insuranceCompany: cmsData.insuranceCompanies[0] || 'Enterprise Insurance Co. Ltd',
                    insurancePolicyNumber: 'POL-ENT-0001',
                    insuranceExpiryDate: '2027-06-12',
                    lastServiceDate: '2026-06-12',
                    lastServiceMileage: 0
                  });
                  setIsAddVehicleOpen(true);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '10px 16px' }}
              >
                <Plus style={{ height: '16px', width: '16px' }} />
                <span>Register Vehicle</span>
              </button>
            </div>
          </div>

          {/* GRID OF VEHICLE CARDS */}
          <div className="vehicles-grid">
            {filteredVehicles.map(vehicle => {
              const rwDays = getDaysDifference(vehicle.roadWorthyExpiry);
              const isExpired = rwDays < 0;
              const isExpiringSoon = rwDays >= 0 && rwDays <= 30;
              const odoStats = getOdometerStats(vehicle.id);
              
              const insDays = getDaysDifference(vehicle.insuranceExpiryDate);
              const isInsExpired = insDays < 0;
              const isInsExpiringSoon = insDays >= 0 && insDays <= 30;

              return (
                <div 
                  key={vehicle.id} 
                  className="glass-panel glass-panel-hover vehicle-card"
                  onClick={() => setSelectedVehicleDetail(vehicle)}
                >
                  {/* Top plate and status badge */}
                  <div className="card-top-row">
                    <div className="card-title-block">
                      <span className="card-brand">{vehicle.make} &bull; {vehicle.designation || 'Vehicle'}</span>
                      <h4 className="card-plate">{vehicle.plateNumber}</h4>
                    </div>
                    <span className={`badge ${
                      vehicle.status === 'Active' ? 'badge-active' :
                      vehicle.status === 'In Service' ? 'badge-service' :
                      vehicle.status === 'Maintenance' ? 'badge-maintenance' : 'badge-out'
                    }`}>
                      {vehicle.status}
                    </span>
                  </div>

                  {/* Middle description fields */}
                  <div className="card-details-list">
                    <p style={{ fontWeight: '600', color: 'var(--text-bright)', fontSize: '0.8rem' }}>
                      {vehicle.model} (Mfg: {vehicle.yearOfManufacture || 'N/A'} | Purchased: {vehicle.yearOfPurchase || 'N/A'})
                    </p>
                    
                    <div className="card-detail-item">
                      <MapPin style={{ height: '14px', width: '14px', color: 'rgba(212,175,55,0.7)' }} />
                      <span>Station: <strong>{stations.find(s => s.id === vehicle.stationId)?.name || vehicle.stationId}</strong></span>
                    </div>
                    
                    <div className="card-detail-item">
                      <User style={{ height: '14px', width: '14px', color: 'rgba(212,175,55,0.7)' }} />
                      <span>Driver: <strong>{vehicle.currentDriver}</strong></span>
                    </div>

                    <div className="card-detail-item">
                      <ShieldCheck style={{ height: '14px', width: '14px', color: 'rgba(212,175,55,0.7)' }} />
                      <span>Insurance: <strong>{vehicle.insuranceCompany || 'Enterprise Insurance'}</strong></span>
                    </div>

                    <div className="card-detail-item">
                      <TrendingUp style={{ height: '14px', width: '14px', color: 'rgba(212,175,55,0.7)' }} />
                      <span>Current Mileage: <strong>{odoStats.currentOdometer.toLocaleString()} km</strong></span>
                    </div>

                    {/* Road worthy warning */}
                    <div className={`rw-expiry-badge ${
                      isExpired ? 'expired' :
                      isExpiringSoon ? 'warning' : 'ok'
                    }`}>
                      <AlertTriangle style={{ height: '14px', width: '14px', flexShrink: 0 }} />
                      <div>
                        {isExpired ? (
                          <span>Road Worthy: <strong>EXPIRED</strong> ({Math.abs(rwDays)}d ago)</span>
                        ) : isExpiringSoon ? (
                          <span>Road Worthy: <strong>Expires in {rwDays}d</strong></span>
                        ) : (
                          <span>Road Worthy: {vehicle.roadWorthyExpiry}</span>
                        )}
                      </div>
                    </div>

                    {/* Insurance expiry indicator if expired or expiring soon */}
                    {(isInsExpired || isInsExpiringSoon) && (
                      <div className={`rw-expiry-badge ${isInsExpired ? 'expired' : 'warning'}`}>
                        <ShieldCheck style={{ height: '14px', width: '14px', flexShrink: 0 }} />
                        <div>
                          {isInsExpired ? (
                            <span>Insurance: <strong>EXPIRED</strong> ({Math.abs(insDays)}d ago)</span>
                          ) : (
                            <span>Insurance: <strong>Expires in {insDays}d</strong></span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card actions */}
                  <div className="card-footer">
                    <span className="card-vin-short" title={`Chassis: ${vehicle.chassisNumber}`}>
                      Chassis: {(vehicle.chassisNumber || '').substring(0, 10)}...
                    </span>
                    
                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleEditVehicleClick(vehicle)}
                        className="card-action-btn"
                        title="Edit specifications"
                      >
                        <Edit3 style={{ height: '14px', width: '14px' }} />
                      </button>
                      <button 
                        onClick={() => handleDeleteVehicleClick(vehicle.id)}
                        className="card-action-btn delete"
                        title="Retire unit"
                      >
                        <Trash2 style={{ height: '14px', width: '14px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredVehicles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }} className="glass-panel">
              <p>No vehicles match the search criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- DRILLDOWN VEHICLE PROFILE DETAILED PANEL --- */}
      {selectedVehicleDetail && (
        <div className="drawer-overlay no-print" onClick={() => setSelectedVehicleDetail(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-body">
              {/* Header */}
              <div className="drawer-top">
                <div className="drawer-top-info">
                  <span>{selectedVehicleDetail.make} Profile</span>
                  <h3>{selectedVehicleDetail.plateNumber}</h3>
                </div>
                <button 
                  onClick={() => setSelectedVehicleDetail(null)}
                  className="modal-close-btn"
                >
                  <X style={{ height: '20px', width: '20px' }} />
                </button>
              </div>

              {/* Status details */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-inset)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status Matrix:</span>
                  <span className={`badge ${
                    selectedVehicleDetail.status === 'Active' ? 'badge-active' :
                    selectedVehicleDetail.status === 'In Service' ? 'badge-service' :
                    selectedVehicleDetail.status === 'Maintenance' ? 'badge-maintenance' : 'badge-out'
                  }`}>{selectedVehicleDetail.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Chassis Number:</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-title)', fontWeight: '600' }}>{selectedVehicleDetail.chassisNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Designation:</span>
                  <span style={{ color: 'var(--text-title)' }}>{selectedVehicleDetail.designation || 'Operational'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Manufacture / Purchase Year:</span>
                  <span style={{ color: 'var(--text-title)' }}>{selectedVehicleDetail.yearOfManufacture || 'N/A'} / {selectedVehicleDetail.yearOfPurchase || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Insurance Partner:</span>
                  <span style={{ color: 'var(--text-title)' }}>{selectedVehicleDetail.insuranceCompany || 'Enterprise Insurance'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Policy Number:</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-title)' }}>{selectedVehicleDetail.insurancePolicyNumber || 'POL-N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Insurance Expiration:</span>
                  <span style={{ color: 'var(--primary-gold)', fontWeight: '600' }}>{selectedVehicleDetail.insuranceExpiryDate || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Base Registry Odometer:</span>
                  <span style={{ color: 'var(--text-title)' }}>{selectedVehicleDetail.baseMileage.toLocaleString()} km</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fuel Tank Capacity:</span>
                  <span style={{ color: 'var(--text-title)' }}>{selectedVehicleDetail.fuelCapacity} Liters</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Road Worthy Expiration:</span>
                  <span style={{ color: 'var(--primary-gold)', fontWeight: '600' }}>{selectedVehicleDetail.roadWorthyExpiry}</span>
                </div>
              </div>

              {/* PARTS CHANGED FOR THIS SPECIFIC VEHICLE */}
              <div>
                <h5 className="drawer-section-title">
                  <Wrench style={{ height: '14px', width: '14px', color: 'var(--primary-gold)' }} />
                  Individual Parts Replaced Counter
                </h5>
                
                {getPartReplacementCounts(selectedVehicleDetail.id).length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No parts replaced recorded in any completed maintenance task.</p>
                ) : (
                  <div className="vehicle-parts-grid">
                    {getPartReplacementCounts(selectedVehicleDetail.id).map(part => (
                      <div key={part.partName} style={{ padding: '10px 14px', background: 'var(--bg-inset)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{part.partName}</span>
                        <strong style={{ color: 'var(--primary-gold)' }}>{part.count} change(s)</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PART REPLACEMENT HISTORY TIMELINE */}
              <div>
                <h5 className="drawer-section-title">
                  <Clock style={{ height: '14px', width: '14px', color: 'var(--primary-gold)' }} />
                  Parts Log History Timeline
                </h5>
                
                {getPartReplacementHistory(selectedVehicleDetail.id).length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No historical part updates recorded.</p>
                ) : (
                  <div className="timeline-list">
                    {getPartReplacementHistory(selectedVehicleDetail.id).map((history, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-item-header">
                          <span className="part-title">{history.partName}</span>
                          <span>{history.serviceDate}</span>
                        </div>
                        <p className="timeline-item-desc">Service: {history.serviceType} &bull; Est cost: {Math.round(history.cost)} GHS</p>
                        {history.notes && <p className="timeline-item-notes">"{history.notes}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Link 
              href={`/reports?vId=${selectedVehicleDetail.id}`}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '24px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setSelectedVehicleDetail(null)}
            >
              Generate Performance Report
            </Link>
          </div>
        </div>
      )}

      {/* --- IMPORT EXCEL / CSV MODAL --- */}
      {isImportModalOpen && (
        <div className="modal-overlay no-print" onClick={() => setIsImportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3><FileSpreadsheet style={{ height: '18px', width: '18px', display: 'inline', marginRight: '8px' }} /> Import Vehicles from Excel / CSV</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="modal-close-btn">
                <X style={{ height: '18px', width: '18px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Select a CSV/Excel file or paste comma-separated vehicle records below. Expected format per row:<br/>
                <code>PlateNumber, ChassisNumber, Make, Model, YearMfg, YearPurchased, Designation, Station, Driver, InsuranceCompany, PolicyNumber, InsuranceExpiry, Status, Mileage, TankCapacity</code>
              </p>

              <div className="form-row">
                <label>Upload File (.csv / .txt)</label>
                <input 
                  type="file" 
                  accept=".csv,.txt"
                  className="form-input" 
                  onChange={handleFileUpload}
                  style={{ padding: '8px' }}
                />
              </div>

              <div className="form-row">
                <label>Or Paste Raw CSV Data</label>
                <textarea 
                  className="form-input" 
                  rows={6}
                  placeholder={`PlateNumber, ChassisNumber, Make, Model, YearMfg, YearPurchased, Designation
GP-909-24, CHS-9901-22, Toyota, LandCruiser, 2023, 2024, Executive Transport`}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsImportModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="button" onClick={handleProcessImportCsv} className="btn btn-primary">Process Import</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT VEHICLE MODAL --- */}
      {isAddVehicleOpen && (
        <div className="modal-overlay no-print" onClick={() => setIsAddVehicleOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingVehicle ? 'Modify Vehicle Register' : 'Register New Fleet Vehicle'}</h3>
              <button onClick={() => setIsAddVehicleOpen(false)} className="modal-close-btn">
                <X style={{ height: '18px', width: '18px' }} />
              </button>
            </div>
            
            <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-grid-2">
                <div className="form-row">
                  <label>Plate Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. GP-201-22"
                    className="form-input"
                    value={vehicleForm.plateNumber}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, plateNumber: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Chassis Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. AHTX12E99002130"
                    className="form-input"
                    value={vehicleForm.chassisNumber}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, chassisNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-row">
                  <label>Make / Brand</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Toyota"
                    className="form-input"
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, make: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Model Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hilux Double Cabin"
                    className="form-input"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, model: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-row">
                  <label>Year of Manufacture</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={vehicleForm.yearOfManufacture}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, yearOfManufacture: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Year of Purchase</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={vehicleForm.yearOfPurchase}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, yearOfPurchase: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Vehicle Designation</label>
                  <select 
                    className="form-select"
                    value={vehicleForm.designation || cmsData.vehicleDesignations[0]}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, designation: e.target.value }))}
                  >
                    {cmsData.vehicleDesignations.map(des => (
                      <option key={des} value={des}>{des}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-row">
                  <label>Insurance Company (DVLA Partner)</label>
                  <select 
                    className="form-select"
                    value={vehicleForm.insuranceCompany || cmsData.insuranceCompanies[0]}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, insuranceCompany: e.target.value }))}
                  >
                    {cmsData.insuranceCompanies.map(ins => (
                      <option key={ins} value={ins}>{ins}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Insurance Policy Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. POL-ENT-9021-2025"
                    className="form-input"
                    value={vehicleForm.insurancePolicyNumber}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-row">
                  <label>Insurance Expiry Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={vehicleForm.insuranceExpiryDate}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, insuranceExpiryDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Road Worthy Registered Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={getRoadWorthyRegDate(vehicleForm.roadWorthyExpiry)}
                    onChange={(e) => {
                      const regDateVal = e.target.value;
                      const expDateVal = getExpiryFromRegDate(regDateVal);
                      setVehicleForm(prev => ({ ...prev, roadWorthyExpiry: expDateVal }));
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-row">
                  <label>Status</label>
                  <select 
                    className="form-select"
                    value={vehicleForm.status}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, status: e.target.value as VehicleStatus }))}
                  >
                    <option value="Active">Active</option>
                    <option value="In Service">In Service</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Initial Odometer (km)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={vehicleForm.baseMileage}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, baseMileage: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-row">
                  <label>Fuel Capacity (L)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={vehicleForm.fuelCapacity}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, fuelCapacity: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-row">
                  <label>Assign Station</label>
                  <select 
                    className="form-select"
                    value={vehicleForm.stationId}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, stationId: e.target.value }))}
                  >
                    {stations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Assign Driver Name</label>
                  <DriverSelect
                    value={vehicleForm.currentDriver || ''}
                    onChange={(val) => setVehicleForm(prev => ({ ...prev, currentDriver: val }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddVehicleOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
