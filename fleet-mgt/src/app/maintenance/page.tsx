'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Wrench, 
  Clock, 
  TrendingUp, 
  X,
  Calendar,
  FileText
} from 'lucide-react';
import { useFleet } from '@/context/FleetContext';
import { MaintenanceLog } from '@/types/fleet';

export default function MaintenancePage() {
  const { 
    vehicles, 
    maintenanceLogs, 
    cmsData,
    addMaintenance, 
    resolveMaintenance 
  } = useFleet();

  // Search & Filter States
  const [maintenanceSearch, setMaintenanceSearch] = useState('');
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState<string>('All');

  // Modal State
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);

  // Form State
  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicleId: '1',
    serviceDate: '2026-06-12',
    serviceType: cmsData.serviceTypes[0] || 'Air Condition Service',
    cost: 0,
    notes: '',
    otherWorkDone: '',
    status: 'Completed' as 'Pending' | 'Completed',
    customParts: '',
    selectedParts: [] as string[]
  });

  const currentMockDateStr = '2026-06-12';

  // Aggregated part replacements counter
  const getPartReplacementCounts = () => {
    const counts: { [key: string]: number } = {};
    const filtered = maintenanceLogs.filter(log => log.status === 'Completed');
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

  // Handle Save
  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const partsArray = [...maintenanceForm.selectedParts];
    if (maintenanceForm.customParts.trim()) {
      maintenanceForm.customParts.split(',').forEach(p => {
        if (p.trim()) partsArray.push(p.trim());
      });
    }

    const newLog: MaintenanceLog = {
      id: `m-${Date.now()}`,
      vehicleId: maintenanceForm.vehicleId,
      serviceDate: maintenanceForm.serviceDate,
      serviceType: maintenanceForm.serviceType,
      cost: Number(maintenanceForm.cost) || 0,
      notes: maintenanceForm.notes,
      otherWorkDone: maintenanceForm.otherWorkDone || undefined,
      status: maintenanceForm.status,
      partsReplaced: partsArray
    };

    addMaintenance(newLog);
    setIsAddMaintenanceOpen(false);

    // Reset Form
    setMaintenanceForm({
      vehicleId: vehicles[0]?.id || '1',
      serviceDate: currentMockDateStr,
      serviceType: cmsData.serviceTypes[0] || 'Air Condition Service',
      cost: 150,
      notes: '',
      otherWorkDone: '',
      status: 'Completed',
      customParts: '',
      selectedParts: []
    });
  };

  const handleResolveMaintenanceClick = (logId: string) => {
    const log = maintenanceLogs.find(l => l.id === logId);
    if (!log) return;
    const confirmCost = prompt(`Complete Service: "${log.serviceType}"\nEnter actual maintenance cost (GHS):`, String(log.cost));
    if (confirmCost === null) return;
    const partsIn = prompt('Enter any replaced parts (comma-separated, e.g. AC Filter, Brakes, Tires):', '');
    const partsArray = partsIn ? partsIn.split(',').map(p => p.trim()).filter(Boolean) : [];
    const otherWork = prompt('Other work done not in list:', log.otherWorkDone || '');
    resolveMaintenance(logId, Number(confirmCost) || log.cost, partsArray, otherWork || undefined);
  };

  // Filter list
  const filteredMaintenance = useMemo(() => {
    return maintenanceLogs.filter(log => {
      const v = vehicles.find(unit => unit.id === log.vehicleId);
      const plate = v ? v.plateNumber : '';
      const matchesSearch = log.serviceType.toLowerCase().includes(maintenanceSearch.toLowerCase()) ||
                            plate.toLowerCase().includes(maintenanceSearch.toLowerCase()) ||
                            log.notes.toLowerCase().includes(maintenanceSearch.toLowerCase()) ||
                            (log.otherWorkDone && log.otherWorkDone.toLowerCase().includes(maintenanceSearch.toLowerCase()));
      const matchesStatus = maintenanceStatusFilter === 'All' || log.status === maintenanceStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [maintenanceLogs, vehicles, maintenanceSearch, maintenanceStatusFilter]);

  return (
    <>
      {/* VIEW CONTAINER */}
      <div className="view-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="no-print">
          {/* PARTS CHANGE COUNTER OVERVIEW */}
          <div className="glass-panel">
            <div className="panel-header" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
              <div className="panel-title">
                <TrendingUp style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                <div>
                  <h4>Fleet Part Replacements Counter</h4>
                  <p>Dynamic counts showing how many times a vehicle's part has been changed across all maintenance tasks</p>
                </div>
              </div>
            </div>

            <div className="parts-counter-grid">
              {getPartReplacementCounts().length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: 'span 4' }}>
                  No parts replaced yet in maintenance logs.
                </p>
              ) : (
                getPartReplacementCounts().map(part => (
                  <div key={part.partName} className="part-tally-card">
                    <div className="part-tally-info">
                      <p>{part.partName}</p>
                      <h5>{part.count} <span>swaps</span></h5>
                    </div>
                    <div className="part-tally-icon">
                      <Wrench style={{ height: '18px', width: '18px' }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SERVICE LOGS AND ACTIONS */}
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Wrench style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                <div>
                  <h4>Maintenance Schedule & Service Logs</h4>
                  <p>Track and schedule Air Conditioning service, oil changes, brake pads, inspections, and custom work</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-input-wrapper" style={{ width: '200px' }}>
                  <Search className="search-icon" style={{ height: '14px', width: '14px', top: '10px' }} />
                  <input 
                    type="text" 
                    placeholder="Search logs & work done..." 
                    className="form-input"
                    style={{ padding: '8px 12px 8px 32px', fontSize: '0.75rem' }}
                    value={maintenanceSearch}
                    onChange={(e) => setMaintenanceSearch(e.target.value)}
                  />
                </div>
                
                <select 
                  className="form-select"
                  style={{ fontSize: '0.75rem', width: '130px', padding: '8px 12px' }}
                  value={maintenanceStatusFilter}
                  onChange={(e) => setMaintenanceStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>

                <button 
                  onClick={() => {
                    setMaintenanceForm({
                      vehicleId: vehicles[0]?.id || '1',
                      serviceDate: currentMockDateStr,
                      serviceType: cmsData.serviceTypes[0] || 'Air Condition Service',
                      cost: 150,
                      notes: '',
                      otherWorkDone: '',
                      status: 'Completed',
                      customParts: '',
                      selectedParts: []
                    });
                    setIsAddMaintenanceOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '8px 14px' }}
                >
                  <Plus style={{ height: '14px', width: '14px' }} />
                  <span>Log Maintenance</span>
                </button>
              </div>
            </div>

            {/* LOGS TABLE */}
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Vehicle Plate</th>
                    <th>Scheduled Date</th>
                    <th>Service Category</th>
                    <th>Cost (GHS)</th>
                    <th>Status</th>
                    <th>Replaced Parts</th>
                    <th>Other Work Done</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaintenance.map(log => {
                    const unit = vehicles.find(v => v.id === log.vehicleId);
                    return (
                      <tr key={log.id}>
                        <td>
                          <strong style={{ color: 'var(--text-title)', fontSize: '0.85rem' }}>{unit ? unit.plateNumber : 'Unknown'}</strong>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{unit?.make} {unit?.model}</p>
                        </td>
                        <td>{log.serviceDate}</td>
                        <td><span style={{ fontWeight: '600', color: 'var(--text-title)' }}>{log.serviceType}</span></td>
                        <td style={{ fontWeight: '700', color: 'var(--text-title)' }}>{log.cost.toLocaleString()} GHS</td>
                        <td>
                          <span className={`badge ${log.status === 'Completed' ? 'badge-active' : 'badge-maintenance'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td>
                          {log.partsReplaced.length === 0 ? (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>None</span>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {log.partsReplaced.map((p, idx) => (
                                <span key={idx} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary-gold)' }}>
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.7rem', color: 'var(--primary-gold)' }} title={log.otherWorkDone || 'None'}>
                          {log.otherWorkDone || '-'}
                        </td>
                        <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.7rem', color: 'var(--text-muted)' }} title={log.notes}>
                          {log.notes}
                        </td>
                        <td>
                          {log.status === 'Pending' ? (
                            <button 
                              onClick={() => handleResolveMaintenanceClick(log.id)}
                              className="btn btn-primary"
                              style={{ fontSize: '0.65rem', padding: '4px 8px' }}
                            >
                              Complete
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Locked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredMaintenance.length === 0 && (
              <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No maintenance events match the filters.</p>
            )}
          </div>
        </div>
      </div>

      {/* --- LOG MAINTENANCE MODAL --- */}
      {isAddMaintenanceOpen && (
        <div className="modal-overlay no-print" onClick={() => setIsAddMaintenanceOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Maintenance Activity</h3>
              <button onClick={() => setIsAddMaintenanceOpen(false)} className="modal-close-btn">
                <X style={{ height: '18px', width: '18px' }} />
              </button>
            </div>
            
            <form onSubmit={handleSaveMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-grid-2">
                <div className="form-row">
                  <label>Select Vehicle</label>
                  <select 
                    className="form-select"
                    value={maintenanceForm.vehicleId}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plateNumber} - {v.make} {v.model}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Service Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={maintenanceForm.serviceDate}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, serviceDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-row">
                  <label>Service Category / Operation</label>
                  <select 
                    className="form-select"
                    value={maintenanceForm.serviceType}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, serviceType: e.target.value }))}
                  >
                    {cmsData.serviceTypes.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Operational Cost (GHS)</label>
                  <input 
                    type="number" 
                    placeholder="Enter GHS cost"
                    className="form-input"
                    value={maintenanceForm.cost || ''}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <label>Status</label>
                <select 
                  className="form-select"
                  value={maintenanceForm.status}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, status: e.target.value as 'Pending' | 'Completed' }))}
                >
                  <option value="Completed">Completed (Swaps & charges logged immediately)</option>
                  <option value="Pending">Pending (Scheduled / Upcoming repair alert)</option>
                </select>
              </div>

              {/* Replaced Parts selection */}
              {maintenanceForm.status === 'Completed' && (
                <div className="checkboxes-box">
                  <span className="checkboxes-title">Declare Swapped Parts (Tally increments automatically)</span>
                  
                  <div className="checkboxes-grid">
                    {['Cabin AC Filter', 'AC Compressor Belt', 'Engine Oil', 'Oil Filter', 'Brakes', 'Tires', 'Battery', 'Air Filter'].map(part => {
                      const isChecked = maintenanceForm.selectedParts.includes(part);
                      return (
                        <label key={part} className="checkbox-label">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setMaintenanceForm(prev => {
                                const list = isChecked 
                                  ? prev.selectedParts.filter(p => p !== part)
                                  : [...prev.selectedParts, part];
                                return { ...prev, selectedParts: list };
                              });
                            }}
                          />
                          <span>{part}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '12px' }} className="form-row">
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Add custom parts (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cabin Filter, Brake Rotor"
                      className="form-input"
                      value={maintenanceForm.customParts}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, customParts: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Custom Other Work Done Field */}
              <div className="form-row">
                <label>Other Work Done (Not in preset list)</label>
                <input 
                  type="text" 
                  placeholder="Record extra tasks completed, e.g., AC Gas Refill, Radiator Flushing, Ducts Sanitized"
                  className="form-input"
                  value={maintenanceForm.otherWorkDone}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, otherWorkDone: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <label>Technician Notes</label>
                <textarea 
                  rows={2} 
                  placeholder="Describe parts health or maintenance findings..."
                  className="form-textarea"
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddMaintenanceOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Log Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
