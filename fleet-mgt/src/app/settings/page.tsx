'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  AlertTriangle, 
  MapPin, 
  Sliders, 
  RotateCcw, 
  Play, 
  Plus, 
  Trash2, 
  Edit3,
  Calendar,
  X,
  Database,
  ShieldCheck,
  Award,
  Wrench,
  Layers
} from 'lucide-react';
import { useFleet } from '@/context/FleetContext';
import { Station, CMSData } from '@/types/fleet';

export default function SettingsPage() {
  const { 
    vehicles,
    stations, 
    systemSettings, 
    cmsData,
    updateSettings, 
    addStation, 
    updateStation, 
    deleteStation, 
    addCMSItem,
    deleteCMSItem,
    resetDatabase, 
    simulateFleetTravel 
  } = useFleet();

  // Profile Form State
  const [adminName, setAdminName] = useState(systemSettings.adminName);
  const [adminBranch, setAdminBranch] = useState(systemSettings.adminBranch);

  // Constants Form State
  const [roadWorthyThreshold, setRoadWorthyThreshold] = useState(systemSettings.roadWorthyThreshold);
  const [insuranceThreshold, setInsuranceThreshold] = useState(systemSettings.insuranceThreshold || 30);
  const [serviceReminderThreshold, setServiceReminderThreshold] = useState(systemSettings.serviceReminderThreshold);
  const [serviceMonthsThreshold, setServiceMonthsThreshold] = useState(systemSettings.serviceMonthsThreshold || 3);
  const [serviceMileageThreshold, setServiceMileageThreshold] = useState(systemSettings.serviceMileageThreshold || 5000);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(systemSettings.fuelPricePerLiter);

  // CMS Management State
  const [activeCmsCategory, setActiveCmsCategory] = useState<keyof CMSData>('insuranceCompanies');
  const [newCmsItemText, setNewCmsItemText] = useState('');

  // Station Modal States
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [stationForm, setStationForm] = useState({
    name: '',
    location: '',
    code: ''
  });

  // Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ adminName, adminBranch });
    alert('Profile configurations updated successfully.');
  };

  // Save Constants
  const handleSaveConstants = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ 
      roadWorthyThreshold: Number(roadWorthyThreshold) || 30, 
      insuranceThreshold: Number(insuranceThreshold) || 30,
      serviceReminderThreshold: Number(serviceReminderThreshold) || 14,
      serviceMonthsThreshold: Number(serviceMonthsThreshold) || 3,
      serviceMileageThreshold: Number(serviceMileageThreshold) || 5000,
      fuelPricePerLiter: Number(fuelPricePerLiter) || 15
    });
    alert('System operational thresholds updated.');
  };

  // Add CMS Item
  const handleAddCmsItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmsItemText.trim()) return;
    addCMSItem(activeCmsCategory, newCmsItemText.trim());
    setNewCmsItemText('');
  };

  // Save Station
  const handleSaveStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationForm.name || !stationForm.location || !stationForm.code) return;

    if (editingStation) {
      updateStation({
        ...editingStation,
        name: stationForm.name,
        location: stationForm.location,
        code: stationForm.code
      });
      setEditingStation(null);
    } else {
      const newStation: Station = {
        id: stationForm.name.toLowerCase().replace(/\s+/g, '-'),
        name: stationForm.name,
        location: stationForm.location,
        code: stationForm.code
      };
      addStation(newStation);
    }

    setIsStationModalOpen(false);
    setStationForm({ name: '', location: '', code: '' });
  };

  const handleEditStationClick = (station: Station) => {
    setEditingStation(station);
    setStationForm({
      name: station.name,
      location: station.location,
      code: station.code
    });
    setIsStationModalOpen(true);
  };

  const handleDeleteStationClick = (station: Station) => {
    const count = vehicles.filter(v => v.stationId === station.id).length;
    if (count > 0) {
      alert(`Cannot delete station "${station.name}". There are currently ${count} fleet vehicles stationed here. Please dispatch them to another depot first.`);
      return;
    }
    
    if (confirm(`Are you sure you want to retire depot "${station.name}" (${station.code})?`)) {
      deleteStation(station.id);
    }
  };

  return (
    <>
      {/* VIEW CONTAINER */}
      <div className="view-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="no-print">
          
          {/* PROFILE & ALERTS SYSTEM GRIDS */}
          <div className="dashboard-split">
            {/* Left: Admin Settings Profiles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Profile Config Form */}
              <div className="glass-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <User style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                    <div>
                      <h4>Administrator Profile</h4>
                      <p>Set system registry operator details shown in reports and logs</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-row">
                    <label>Operator Name</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Office / Branch Location</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={adminBranch}
                      onChange={(e) => setAdminBranch(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', fontSize: '0.75rem', padding: '8px 14px' }}>
                    Save Profile
                  </button>
                </form>
              </div>

              {/* Operations Rules Form */}
              <div className="glass-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <Sliders style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                    <div>
                      <h4>System Threshold Rules</h4>
                      <p>Adjust alert parameters for Road Worthy, Insurance, and 3-Month / 5,000 km Servicing</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveConstants} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-grid-2">
                    <div className="form-row">
                      <label>Road Worthy Expiry Notice (days)</label>
                      <input 
                        type="number" 
                        min="1"
                        className="form-input"
                        value={roadWorthyThreshold}
                        onChange={(e) => setRoadWorthyThreshold(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label>Insurance Expiry Notice (days)</label>
                      <input 
                        type="number" 
                        min="1"
                        className="form-input"
                        value={insuranceThreshold}
                        onChange={(e) => setInsuranceThreshold(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-row">
                      <label>Servicing Month Interval (Months)</label>
                      <input 
                        type="number" 
                        min="1"
                        className="form-input"
                        value={serviceMonthsThreshold}
                        onChange={(e) => setServiceMonthsThreshold(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <label>Servicing Mileage Limit (km)</label>
                      <input 
                        type="number" 
                        min="1000"
                        step="500"
                        className="form-input"
                        value={serviceMileageThreshold}
                        onChange={(e) => setServiceMileageThreshold(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <label>Mock Fuel Price (GHS / Liter)</label>
                    <input 
                      type="number" 
                      min="0.1"
                      step="0.01"
                      className="form-input"
                      value={fuelPricePerLiter}
                      onChange={(e) => setFuelPricePerLiter(Number(e.target.value))}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', fontSize: '0.75rem', padding: '8px 14px' }}>
                    Save Thresholds
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Simulation & Developer Controls */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="panel-header" style={{ marginBottom: 0 }}>
                <div className="panel-title">
                  <RotateCcw style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                  <div>
                    <h4>Developer Actions & Simulations</h4>
                    <p>Trigger database resets or mock fleet mileage activities</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                <div style={{ padding: '14px', background: 'var(--bg-inset)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-gold)' }}>Fleet Distance Simulation</span>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Simulate real-time driving for active vehicles. This automatically updates vehicle odometers and appends logs, letting you check efficiency graphs immediately.
                  </p>
                  <button 
                    onClick={simulateFleetTravel}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', width: '100%', padding: '10px 0', marginTop: '6px', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Play style={{ height: '12px', width: '12px' }} />
                    <span>Run Travel Simulation</span>
                  </button>
                </div>

                <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--danger)' }}>System Factory Reset</span>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Restores all vehicle directories, maintenance transactions, fuel charts, and administrative thresholds to the factory mock seeds. Warning: Custom inputs will be deleted.
                  </p>
                  <button 
                    onClick={resetDatabase}
                    className="btn btn-danger"
                    style={{ fontSize: '0.75rem', width: '100%', padding: '10px 0', marginTop: '6px' }}
                  >
                    Reset System Database
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* --- EXTENSIVE CMS MANAGEMENT TAB / PANEL --- */}
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Database style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                <div>
                  <h4>Extensive CMS Data Management</h4>
                  <p>Configure master system dropdown options for Insurance Companies, Designations, License Classes, and Service Categories</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Category Selector Tabs */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <button
                  onClick={() => setActiveCmsCategory('insuranceCompanies')}
                  className={`btn ${activeCmsCategory === 'insuranceCompanies' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                >
                  <ShieldCheck style={{ height: '14px', width: '14px', marginRight: '6px', display: 'inline' }} />
                  Insurance Partners ({cmsData.insuranceCompanies.length})
                </button>

                <button
                  onClick={() => setActiveCmsCategory('vehicleDesignations')}
                  className={`btn ${activeCmsCategory === 'vehicleDesignations' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                >
                  <Layers style={{ height: '14px', width: '14px', marginRight: '6px', display: 'inline' }} />
                  Vehicle Designations ({cmsData.vehicleDesignations.length})
                </button>

                <button
                  onClick={() => setActiveCmsCategory('licenseClasses')}
                  className={`btn ${activeCmsCategory === 'licenseClasses' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                >
                  <Award style={{ height: '14px', width: '14px', marginRight: '6px', display: 'inline' }} />
                  Licence Classes ({cmsData.licenseClasses.length})
                </button>

                <button
                  onClick={() => setActiveCmsCategory('serviceTypes')}
                  className={`btn ${activeCmsCategory === 'serviceTypes' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                >
                  <Wrench style={{ height: '14px', width: '14px', marginRight: '6px', display: 'inline' }} />
                  Service Categories ({cmsData.serviceTypes.length})
                </button>
              </div>

              {/* Add CMS Item Form */}
              <form onSubmit={handleAddCmsItem} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="form-input"
                  style={{ fontSize: '0.8rem', maxWidth: '400px' }}
                  placeholder={`Add new ${
                    activeCmsCategory === 'insuranceCompanies' ? 'Insurance Company' :
                    activeCmsCategory === 'vehicleDesignations' ? 'Vehicle Designation' :
                    activeCmsCategory === 'licenseClasses' ? 'Licence Class' : 'Service Category'
                  }...`}
                  value={newCmsItemText}
                  onChange={(e) => setNewCmsItemText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '8px 16px' }}>
                  <Plus style={{ height: '14px', width: '14px' }} />
                  <span>Add Option</span>
                </button>
              </form>

              {/* Item List Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {cmsData[activeCmsCategory].map(item => (
                  <div 
                    key={item} 
                    style={{
                      padding: '10px 14px',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem'
                    }}
                  >
                    <span style={{ color: 'var(--text-bright)', fontWeight: '500' }}>{item}</span>
                    <button
                      type="button"
                      onClick={() => deleteCMSItem(activeCmsCategory, item)}
                      className="card-action-btn delete"
                      title="Remove option"
                    >
                      <Trash2 style={{ height: '13px', width: '13px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STATION REGISTRY MANAGEMENT PANEL */}
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <MapPin style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                <div>
                  <h4>Operational Stations / Depots</h4>
                  <p>Register and manage geographic stations. Vehicles are dispatched and tracked by these nodes.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setEditingStation(null);
                  setStationForm({ name: '', location: '', code: '' });
                  setIsStationModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.75rem', padding: '8px 14px' }}
              >
                <Plus style={{ height: '14px', width: '14px' }} />
                <span>Add Station</span>
              </button>
            </div>

            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th>Depot Name</th>
                    <th>Depot Code</th>
                    <th>Geographic Region</th>
                    <th>Stationed Units Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map(station => {
                    const count = vehicles.filter(v => v.stationId === station.id).length;
                    return (
                      <tr key={station.id}>
                        <td><strong style={{ color: 'var(--text-title)', fontSize: '0.8rem' }}>{station.name}</strong></td>
                        <td><span className="station-code">{station.code}</span></td>
                        <td style={{ color: 'var(--text-muted)' }}>{station.location}</td>
                        <td style={{ fontWeight: '600' }}>{count} vehicle(s)</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleEditStationClick(station)}
                              className="card-action-btn"
                              title="Modify details"
                            >
                              <Edit3 style={{ height: '13px', width: '13px' }} />
                            </button>
                            <button 
                              onClick={() => handleDeleteStationClick(station)}
                              className="card-action-btn delete"
                              title="Retire depot"
                            >
                              <Trash2 style={{ height: '13px', width: '13px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD/EDIT STATION MODAL --- */}
      {isStationModalOpen && (
        <div className="modal-overlay no-print" onClick={() => setIsStationModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStation ? 'Modify Station Info' : 'Add Depot Location'}</h3>
              <button onClick={() => setIsStationModalOpen(false)} className="modal-close-btn">
                <X style={{ height: '18px', width: '18px' }} />
              </button>
            </div>
            
            <form onSubmit={handleSaveStation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-row">
                <label>Station Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Accra Central Hub"
                  className="form-input"
                  value={stationForm.name}
                  onChange={(e) => setStationForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-row">
                  <label>Region Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Greater Accra"
                    className="form-input"
                    value={stationForm.location}
                    onChange={(e) => setStationForm(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Depot Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ACC-01"
                    className="form-input"
                    value={stationForm.code}
                    onChange={(e) => setStationForm(prev => ({ ...prev, code: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsStationModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Station</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
