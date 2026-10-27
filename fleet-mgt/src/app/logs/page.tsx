'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Filter, 
  Wrench, 
  Fuel, 
  Clock,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { useFleet } from '@/context/FleetContext';
import { Vehicle, MaintenanceLog, FuelLog, AssignmentLog } from '@/types/fleet';

export default function LogsPage() {
  const { vehicles, maintenanceLogs, fuelLogs, assignmentLogs, stations } = useFleet();

  // Search & Filter States
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [stationFilter, setStationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Accordion Expand/Collapse States (Stores expanded vehicle IDs)
  const [expandedVehicleIds, setExpandedVehicleIds] = useState<string[]>([]);
  
  // Tab states for each expanded vehicle (vehicleId -> 'maintenance' | 'fuel' | 'assignment')
  const [vehicleTab, setVehicleTab] = useState<Record<string, 'maintenance' | 'fuel' | 'assignment'>>({});

  // Toggle vehicle accordion
  const toggleExpand = (vehicleId: string) => {
    setExpandedVehicleIds(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
    // Initialize tab state to maintenance if not already set
    if (!vehicleTab[vehicleId]) {
      setVehicleTab(prev => ({ ...prev, [vehicleId]: 'maintenance' }));
    }
  };

  const setTab = (vehicleId: string, tab: 'maintenance' | 'fuel' | 'assignment') => {
    setVehicleTab(prev => ({ ...prev, [vehicleId]: tab }));
  };

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = v.plateNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                            v.make.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                            v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                            v.currentDriver.toLowerCase().includes(vehicleSearch.toLowerCase());
      const matchesStation = stationFilter === 'All' || v.stationId === stationFilter;
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
      return matchesSearch && matchesStation && matchesStatus;
    });
  }, [vehicles, vehicleSearch, stationFilter, statusFilter]);

  // Aggregate stats count helper
  const getLogCounts = (vehicleId: string) => {
    const maintCount = maintenanceLogs.filter(log => log.vehicleId === vehicleId).length;
    const fuelCount = fuelLogs.filter(log => log.vehicleId === vehicleId).length;
    const assignmentCount = assignmentLogs.filter(log => log.vehicleId === vehicleId).length;
    return { maintCount, fuelCount, assignmentCount, total: maintCount + fuelCount + assignmentCount };
  };

  return (
    <div className="view-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="no-print">
        
        {/* Search, Filter Toolbar */}
        <div className="glass-panel toolbar">
          <div className="search-filter-group">
            <div className="search-input-wrapper">
              <Search className="search-icon" style={{ height: '16px', width: '16px' }} />
              <input 
                type="text" 
                placeholder="Search plate, model, driver..." 
                className="form-input"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
              />
            </div>
            
            <div className="filter-select-wrapper">
              <Filter style={{ height: '14px', width: '14px' }} />
              <select 
                className="form-select"
                style={{ fontSize: '0.82rem', width: '140px', padding: '8px 12px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
              style={{ fontSize: '0.82rem', width: '180px', padding: '8px 12px' }}
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
            >
              <option value="All">All Stations Depot</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Unified Logs Accordion Table */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}></th>
                  <th>Vehicle Plate</th>
                  <th>Brand & Model</th>
                  <th>Depot Station</th>
                  <th>Active Operator</th>
                  <th style={{ textAlign: 'center' }}>Logs Record Count</th>
                  <th>Current Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(vehicle => {
                  const isExpanded = expandedVehicleIds.includes(vehicle.id);
                  const activeVehicleTab = vehicleTab[vehicle.id] || 'maintenance';
                  const counts = getLogCounts(vehicle.id);
                  const vehicleMaintLogs = maintenanceLogs.filter(log => log.vehicleId === vehicle.id)
                    .sort((a,b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
                  const vehicleFuelLogs = fuelLogs.filter(log => log.vehicleId === vehicle.id)
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  const vehicleAssignmentLogs = assignmentLogs.filter(log => log.vehicleId === vehicle.id)
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  
                  return (
                    <React.Fragment key={vehicle.id}>
                      {/* Main Row */}
                      <tr 
                        onClick={() => toggleExpand(vehicle.id)} 
                        style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                        className={isExpanded ? 'active-row-expanded' : ''}
                      >
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <button 
                            className="card-action-btn"
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              transform: isExpanded ? 'rotate(90deg)' : 'none', 
                              transition: 'transform 0.2s' 
                            }}
                          >
                            <ChevronRight style={{ height: '18px', width: '18px', color: 'var(--primary-gold)' }} />
                          </button>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text-title)', fontSize: '0.92rem' }}>{vehicle.plateNumber}</strong>
                        </td>
                        <td style={{ color: 'var(--text-bright)' }}>
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin style={{ height: '14px', width: '14px', color: 'rgba(212,175,55,0.7)' }} />
                            <span>{stations.find(s => s.id === vehicle.stationId)?.name || vehicle.stationId}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User style={{ height: '14px', width: '14px', color: 'rgba(212,175,55,0.7)' }} />
                            <span>{vehicle.currentDriver}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-title)' }}>
                          {counts.total} activity log(s)
                        </td>
                        <td>
                          <span className={`badge ${
                            vehicle.status === 'Active' ? 'badge-active' :
                            vehicle.status === 'In Service' ? 'badge-service' :
                            vehicle.status === 'Maintenance' ? 'badge-maintenance' : 'badge-out'
                          }`}>
                            {vehicle.status}
                          </span>
                        </td>
                      </tr>

                      {/* Dropdown Expanded Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ background: 'var(--bg-inset)', padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              
                              {/* Accordion Tabs */}
                              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                                <button 
                                  className={`btn ${activeVehicleTab === 'maintenance' ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTab(vehicle.id, 'maintenance');
                                  }}
                                >
                                  <Wrench style={{ height: '14px', width: '14px' }} />
                                  <span>Maintenance History ({counts.maintCount})</span>
                                </button>
                                
                                <button 
                                  className={`btn ${activeVehicleTab === 'fuel' ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTab(vehicle.id, 'fuel');
                                  }}
                                >
                                  <Fuel style={{ height: '14px', width: '14px' }} />
                                  <span>Fuel dispatches ({counts.fuelCount})</span>
                                </button>

                                <button 
                                  className={`btn ${activeVehicleTab === 'assignment' ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTab(vehicle.id, 'assignment');
                                  }}
                                >
                                  <User style={{ height: '14px', width: '14px' }} />
                                  <span>Driver Assignments ({counts.assignmentCount})</span>
                                </button>
                              </div>

                              {/* Tab Content 1: Maintenance Services Table */}
                              {activeVehicleTab === 'maintenance' && (
                                <div>
                                  {vehicleMaintLogs.length === 0 ? (
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                                      No maintenance logs found for this unit.
                                    </p>
                                  ) : (
                                    <div className="table-container" style={{ background: 'var(--bg-card-solid)' }}>
                                      <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                                        <thead>
                                          <tr style={{ background: 'rgba(0,0,0,0.1)' }}>
                                            <th style={{ padding: '8px 12px' }}>Date</th>
                                            <th style={{ padding: '8px 12px' }}>Service Operation</th>
                                            <th style={{ padding: '8px 12px' }}>Cost (GHS)</th>
                                            <th style={{ padding: '8px 12px' }}>Replaced Parts</th>
                                            <th style={{ padding: '8px 12px' }}>Technician Notes</th>
                                            <th style={{ padding: '8px 12px' }}>Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {vehicleMaintLogs.map(log => (
                                            <tr key={log.id}>
                                              <td style={{ padding: '8px 12px' }}>{log.serviceDate}</td>
                                              <td style={{ padding: '8px 12px' }}>
                                                <strong style={{ color: 'var(--text-title)' }}>{log.serviceType}</strong>
                                              </td>
                                              <td style={{ padding: '8px 12px', fontWeight: '600' }}>
                                                {log.cost.toLocaleString()} GHS
                                              </td>
                                              <td style={{ padding: '8px 12px' }}>
                                                {log.partsReplaced.length === 0 ? (
                                                  <span style={{ color: 'var(--text-muted)' }}>None</span>
                                                ) : (
                                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {log.partsReplaced.map((part, idx) => (
                                                      <span 
                                                        key={idx} 
                                                        style={{ 
                                                          fontSize: '0.68rem', 
                                                          background: 'rgba(212,175,55,0.08)', 
                                                          border: '1px solid rgba(212,175,55,0.15)', 
                                                          padding: '1px 6px', 
                                                          borderRadius: '4px', 
                                                          color: 'var(--primary-gold)' 
                                                        }}
                                                      >
                                                        {part}
                                                      </span>
                                                    ))}
                                                  </div>
                                                )}
                                              </td>
                                              <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                {log.notes || 'N/A'}
                                              </td>
                                              <td style={{ padding: '8px 12px' }}>
                                                <span className={`badge ${log.status === 'Completed' ? 'badge-active' : 'badge-maintenance'}`}>
                                                  {log.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Tab Content 2: Fuel Log Table */}
                              {activeVehicleTab === 'fuel' && (
                                <div>
                                  {vehicleFuelLogs.length === 0 ? (
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                                      No fuel fillup logs registered for this unit.
                                    </p>
                                  ) : (
                                    <div className="table-container" style={{ background: 'var(--bg-card-solid)' }}>
                                      <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                                        <thead>
                                          <tr style={{ background: 'rgba(0,0,0,0.1)' }}>
                                            <th style={{ padding: '8px 12px' }}>Date</th>
                                            <th style={{ padding: '8px 12px' }}>Liters Filled</th>
                                            <th style={{ padding: '8px 12px' }}>Cost (GHS)</th>
                                            <th style={{ padding: '8px 12px' }}>Odometer reading</th>
                                            <th style={{ padding: '8px 12px' }}>Cost/Liter</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {vehicleFuelLogs.map(log => {
                                            const costPerL = log.liters > 0 ? (log.cost / log.liters).toFixed(2) : '0';
                                            return (
                                              <tr key={log.id}>
                                                <td style={{ padding: '8px 12px' }}>{log.date}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: '600' }}>{log.liters} Liters</td>
                                                <td style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--text-title)' }}>
                                                  {log.cost.toLocaleString()} GHS
                                                </td>
                                                <td style={{ padding: '8px 12px' }}>{log.odometerReading.toLocaleString()} km</td>
                                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{costPerL} GHS/L</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Tab Content 3: Driver Assignment Logs Table */}
                              {activeVehicleTab === 'assignment' && (
                                <div>
                                  {vehicleAssignmentLogs.length === 0 ? (
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                                      No assignment logs registered for this unit.
                                    </p>
                                  ) : (
                                    <div className="table-container" style={{ background: 'var(--bg-card-solid)' }}>
                                      <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                                        <thead>
                                          <tr style={{ background: 'rgba(0,0,0,0.1)' }}>
                                            <th style={{ padding: '8px 12px' }}>Date</th>
                                            <th style={{ padding: '8px 12px' }}>Assigned Operator</th>
                                            <th style={{ padding: '8px 12px' }}>Depot Station</th>
                                            <th style={{ padding: '8px 12px' }}>Notes</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {vehicleAssignmentLogs.map(log => (
                                            <tr key={log.id}>
                                              <td style={{ padding: '8px 12px' }}>{log.date}</td>
                                              <td style={{ padding: '8px 12px', fontWeight: '600' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  <User style={{ height: '14px', width: '14px', color: 'var(--primary-gold)' }} />
                                                  <span>{log.driverName}</span>
                                                </div>
                                              </td>
                                              <td style={{ padding: '8px 12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  <MapPin style={{ height: '14px', width: '14px', color: 'var(--primary-gold)' }} />
                                                  <span>{stations.find(s => s.id === log.stationId)?.name || log.stationId}</span>
                                                </div>
                                              </td>
                                              <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                {log.notes || 'N/A'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredVehicles.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No registry entries found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
