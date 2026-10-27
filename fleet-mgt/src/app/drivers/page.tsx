'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Edit3, 
  Trash2, 
  X,
  Car,
  MapPin,
  Award
} from 'lucide-react';
import { useFleet } from '@/context/FleetContext';
import { Driver } from '@/types/fleet';

export default function DriversPage() {
  const { 
    drivers,
    vehicles,
    stations,
    cmsData,
    addDriver,
    updateDriver,
    deleteDriver
  } = useFleet();

  // Search & Filter States
  const [driverSearch, setDriverSearch] = useState('');
  const [stationFilter, setStationFilter] = useState<string>('All');
  const [licenseClassFilter, setLicenseClassFilter] = useState<string>('All');

  // Modals
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form State
  const [driverForm, setDriverForm] = useState<Partial<Driver>>({
    name: '',
    licenseNumber: '',
    phone: '',
    email: '',
    licenseClass: 'Class B',
    stationId: 'accra'
  });

  // Handle Save
  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name || !driverForm.licenseNumber || !driverForm.phone) return;

    if (editingDriver) {
      updateDriver({
        ...editingDriver,
        ...driverForm
      } as Driver);
      setEditingDriver(null);
    } else {
      const newDriver: Driver = {
        id: `d-${Date.now()}`,
        name: driverForm.name,
        licenseNumber: driverForm.licenseNumber,
        phone: driverForm.phone,
        email: driverForm.email || 'N/A',
        licenseClass: driverForm.licenseClass || 'Class B',
        stationId: driverForm.stationId || 'accra'
      };
      addDriver(newDriver);
    }

    setIsAddDriverOpen(false);
    // Reset form
    setDriverForm({
      name: '',
      licenseNumber: '',
      phone: '',
      email: '',
      licenseClass: 'Class B',
      stationId: 'accra'
    });
  };

  const handleEditDriverClick = (driver: Driver) => {
    setEditingDriver(driver);
    setDriverForm(driver);
    setIsAddDriverOpen(true);
  };

  const handleDeleteDriverClick = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove driver ${name}? This will unassign them from any assigned vehicles.`)) {
      deleteDriver(id);
    }
  };

  // Filter list
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                            d.licenseNumber.toLowerCase().includes(driverSearch.toLowerCase()) ||
                            d.phone.includes(driverSearch) ||
                            d.email.toLowerCase().includes(driverSearch.toLowerCase());
      const matchesStation = stationFilter === 'All' || d.stationId === stationFilter;
      const matchesClass = licenseClassFilter === 'All' || d.licenseClass === licenseClassFilter;
      return matchesSearch && matchesStation && matchesClass;
    });
  }, [drivers, driverSearch, stationFilter, licenseClassFilter]);

  // Find assigned vehicle helper
  const getAssignedVehicle = (driverName: string) => {
    return vehicles.find(v => v.currentDriver.trim().toLowerCase() === driverName.trim().toLowerCase());
  };

  return (
    <>
      <div className="view-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="no-print">
          {/* SEARCH, FILTER AND ADD BAR */}
          <div className="glass-panel toolbar">
            <div className="search-filter-group">
              <div className="search-input-wrapper">
                <Search className="search-icon" style={{ height: '16px', width: '16px' }} />
                <input 
                  type="text" 
                  placeholder="Search driver name, license, phone..." 
                  className="form-input"
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                />
              </div>
              
              <div className="filter-select-wrapper">
                <Filter style={{ height: '14px', width: '14px' }} />
                <select 
                  className="form-select"
                  style={{ fontSize: '0.75rem', width: '140px', padding: '8px 12px' }}
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                >
                  <option value="All">All Stations</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <select 
                className="form-select"
                style={{ fontSize: '0.75rem', width: '130px', padding: '8px 12px' }}
                value={licenseClassFilter}
                onChange={(e) => setLicenseClassFilter(e.target.value)}
              >
                <option value="All">All Classes</option>
                {cmsData.licenseClasses.map(lc => (
                  <option key={lc} value={lc}>{lc}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => {
                setEditingDriver(null);
                setDriverForm({
                  name: '',
                  licenseNumber: '',
                  phone: '',
                  email: '',
                  licenseClass: cmsData.licenseClasses[1] || 'Class B',
                  stationId: stations[0]?.id || 'accra'
                });
                setIsAddDriverOpen(true);
              }}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '10px 16px' }}
            >
              <Plus style={{ height: '16px', width: '16px' }} />
              <span>Register Driver</span>
            </button>
          </div>

          {/* GRID OF DRIVER CARDS */}
          <div className="vehicles-grid">
            {filteredDrivers.map(driver => {
              const assignedVehicle = getAssignedVehicle(driver.name);
              const driverStation = stations.find(s => s.id === driver.stationId);
              
              return (
                <div 
                  key={driver.id} 
                  className="glass-panel glass-panel-hover vehicle-card"
                  style={{ minHeight: '220px' }}
                >
                  {/* Top Name and License Class */}
                  <div className="card-top-row">
                    <div className="card-title-block">
                      <span className="card-brand">Driver Operator</span>
                      <h4 className="card-plate" style={{ fontSize: '1.15rem' }}>{driver.name}</h4>
                    </div>
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: '700', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        background: 'rgba(212, 175, 55, 0.15)', 
                        color: 'var(--primary-gold)',
                        border: '1px solid rgba(212, 175, 55, 0.3)'
                      }}
                    >
                      {driver.licenseClass || 'Class B'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="card-details-list">
                    <div className="card-detail-item">
                      <FileText style={{ height: '14px', width: '14px', color: 'rgba(212,175,55,0.7)' }} />
                      <span>Lic: <strong>{driver.licenseNumber}</strong></span>
                    </div>

                    <div className="card-detail-item">
                      <MapPin style={{ height: '14px', width: '14px', color: 'rgba(212,175,55,0.7)' }} />
                      <span>Station: <strong>{driverStation ? driverStation.name : driver.stationId || 'Accra Hub'}</strong></span>
                    </div>

                    <div className="card-detail-item">
                      <Phone style={{ height: '14px', width: '14px', color: 'rgba(212,175,55,0.7)' }} />
                      <span>Phone: <strong>{driver.phone}</strong></span>
                    </div>

                    <div className="card-detail-item">
                      <Mail style={{ height: '14px', width: '14px', color: 'rgba(212,175,55,0.7)' }} />
                      <span>Email: <strong style={{ textTransform: 'none' }}>{driver.email}</strong></span>
                    </div>

                    {/* Assigned Vehicle Section */}
                    <div 
                      className={`rw-expiry-badge ${
                        assignedVehicle ? 'ok' : 'warning'
                      }`}
                      style={{ marginTop: '8px' }}
                    >
                      <Car style={{ height: '14px', width: '14px', flexShrink: 0 }} />
                      <div>
                        {assignedVehicle ? (
                          <span>Assigned: <strong>{assignedVehicle.plateNumber}</strong> ({assignedVehicle.make} {assignedVehicle.model})</span>
                        ) : (
                          <span>Status: <strong>No Vehicle Assigned</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="card-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span className="card-vin-short" style={{ fontSize: '0.65rem' }}>ID: {driver.id}</span>
                    
                    <div className="card-actions">
                      <button 
                        onClick={() => handleEditDriverClick(driver)}
                        className="card-action-btn"
                        title="Edit driver profile"
                      >
                        <Edit3 style={{ height: '14px', width: '14px' }} />
                      </button>
                      <button 
                        onClick={() => handleDeleteDriverClick(driver.id, driver.name)}
                        className="card-action-btn delete"
                        title="Remove driver"
                      >
                        <Trash2 style={{ height: '14px', width: '14px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDrivers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }} className="glass-panel">
              <p>No drivers match the search criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD/EDIT DRIVER MODAL --- */}
      {isAddDriverOpen && (
        <div className="modal-overlay no-print" onClick={() => setIsAddDriverOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDriver ? 'Modify Driver Profile' : 'Register New Driver'}</h3>
              <button onClick={() => setIsAddDriverOpen(false)} className="modal-close-btn">
                <X style={{ height: '18px', width: '18px' }} />
              </button>
            </div>
            
            <form onSubmit={handleSaveDriver} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-row">
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Emmanuel Osei"
                  className="form-input"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-row">
                  <label>License Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. DL-2022091"
                    className="form-input"
                    value={driverForm.licenseNumber}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 0244112233"
                    className="form-input"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-row">
                  <label>Class of Licence</label>
                  <select 
                    className="form-select"
                    value={driverForm.licenseClass || cmsData.licenseClasses[1] || 'Class B'}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, licenseClass: e.target.value }))}
                    required
                  >
                    {cmsData.licenseClasses.map(lc => (
                      <option key={lc} value={lc}>{lc}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Station Depot</label>
                  <select 
                    className="form-select"
                    value={driverForm.stationId || stations[0]?.id || 'accra'}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, stationId: e.target.value }))}
                    required
                  >
                    {stations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. driver@dvla.gov.gh"
                  className="form-input"
                  value={driverForm.email === 'N/A' ? '' : driverForm.email}
                  onChange={(e) => setDriverForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddDriverOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
