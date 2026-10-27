'use client';

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  User, 
  Calendar, 
  Wrench, 
  Car, 
  CheckCircle2, 
  TrendingUp,
  RefreshCw,
  Sliders,
  ShieldCheck,
  X
} from 'lucide-react';
import { useFleet } from '@/context/FleetContext';
import { Vehicle, MaintenanceLog } from '@/types/fleet';
import DriverSelect from '@/components/DriverSelect';

export default function DashboardPage() {
  const { 
    vehicles, 
    maintenanceLogs, 
    fuelLogs,
    stations, 
    resolveMaintenance, 
    renewRoadWorthy, 
    renewInsurance,
    reassignVehicle,
    systemSettings
  } = useFleet();

  // Modal State for reassignment
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignTargetVehicle, setReassignTargetVehicle] = useState<Vehicle | null>(null);
  const [reassignForm, setReassignForm] = useState({
    stationId: 'accra',
    currentDriver: ''
  });

  const currentMockDateStr = '2026-06-12';
  
  const getDaysDifference = (dateStr?: string) => {
    if (!dateStr) return 0;
    const target = new Date(dateStr);
    const current = new Date(currentMockDateStr);
    const diffTime = target.getTime() - current.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getOdometerStats = (vId: string) => {
    const sortedAll = [...fuelLogs].filter(f => f.vehicleId === vId).sort((a,b) => a.odometerReading - b.odometerReading);
    const vehicle = vehicles.find(v => v.id === vId);
    
    if (sortedAll.length === 0) {
      return { currentOdometer: vehicle ? vehicle.baseMileage : 0 };
    }
    return { currentOdometer: sortedAll[sortedAll.length - 1].odometerReading };
  };

  // Compute Alerts dynamically
  const alerts = useMemo(() => {
    const list: {
      id: string;
      type: 'danger' | 'warning' | 'info';
      category: 'Road Worthy' | 'Insurance' | 'Maintenance' | 'Inspection';
      vehicleId: string;
      plateNumber: string;
      title: string;
      description: string;
      date: string;
      daysDiff: number;
      actionLabel?: string;
      logId?: string;
      actionType?: 'roadWorthy' | 'insurance' | 'maintenance';
    }[] = [];

    // 1. Road Worthy Certificate Expirations
    vehicles.forEach(v => {
      const diff = getDaysDifference(v.roadWorthyExpiry);
      if (diff < 0) {
        list.push({
          id: `rw-expired-${v.id}`,
          type: 'danger',
          category: 'Road Worthy',
          vehicleId: v.id,
          plateNumber: v.plateNumber,
          title: `Road Worthy Expired: ${v.plateNumber}`,
          description: `The road worthy certificate expired on ${v.roadWorthyExpiry} (${Math.abs(diff)} days ago). Driving is unauthorized.`,
          date: v.roadWorthyExpiry,
          daysDiff: diff,
          actionLabel: 'Renew Certificate',
          actionType: 'roadWorthy'
        });
      } else if (diff <= systemSettings.roadWorthyThreshold) {
        list.push({
          id: `rw-expiring-${v.id}`,
          type: 'warning',
          category: 'Road Worthy',
          vehicleId: v.id,
          plateNumber: v.plateNumber,
          title: `Road Worthy Expiring Soon: ${v.plateNumber}`,
          description: `Road worthy will expire in ${diff} days (${v.roadWorthyExpiry}). Schedule an inspection.`,
          date: v.roadWorthyExpiry,
          daysDiff: diff,
          actionLabel: 'Renew Certificate',
          actionType: 'roadWorthy'
        });
      }
    });

    // 2. Insurance Expiration Alerts (Annual DVLA Partner Service)
    vehicles.forEach(v => {
      const diff = getDaysDifference(v.insuranceExpiryDate);
      const company = v.insuranceCompany || 'DVLA Partner Insurance';
      if (diff < 0) {
        list.push({
          id: `ins-expired-${v.id}`,
          type: 'danger',
          category: 'Insurance',
          vehicleId: v.id,
          plateNumber: v.plateNumber,
          title: `Annual Insurance Expired: ${v.plateNumber}`,
          description: `Annual policy with ${company} (${v.insurancePolicyNumber || 'N/A'}) expired on ${v.insuranceExpiryDate} (${Math.abs(diff)} days ago).`,
          date: v.insuranceExpiryDate || '',
          daysDiff: diff,
          actionLabel: 'Renew Policy',
          actionType: 'insurance'
        });
      } else if (diff <= (systemSettings.insuranceThreshold || 30)) {
        list.push({
          id: `ins-expiring-${v.id}`,
          type: 'warning',
          category: 'Insurance',
          vehicleId: v.id,
          plateNumber: v.plateNumber,
          title: `Insurance Policy Renewal Due: ${v.plateNumber}`,
          description: `Annual policy with ${company} expires in ${diff} days (${v.insuranceExpiryDate}).`,
          date: v.insuranceExpiryDate || '',
          daysDiff: diff,
          actionLabel: 'Renew Policy',
          actionType: 'insurance'
        });
      }
    });

    // 3. Periodic Servicing Alerts (3 Months or 5,000 km Mileage threshold)
    vehicles.forEach(v => {
      const currentOdo = getOdometerStats(v.id).currentOdometer;
      const lastServiceOdo = v.lastServiceMileage ?? v.baseMileage;
      const kmDrivenSinceService = Math.max(0, currentOdo - lastServiceOdo);

      const daysSinceService = v.lastServiceDate ? Math.abs(getDaysDifference(v.lastServiceDate)) : 100;
      const monthsSinceService = daysSinceService / 30;

      const isMileageOverdue = kmDrivenSinceService >= 5000;
      const isTimeOverdue = daysSinceService >= 90; // 3 months

      if (isMileageOverdue || isTimeOverdue) {
        const reason = isMileageOverdue && isTimeOverdue
          ? `3 months reached (${daysSinceService} days) AND 5,000 km mileage threshold reached (${kmDrivenSinceService.toLocaleString()} km driven).`
          : isMileageOverdue
          ? `Mileage reached 5,000 km limit (${kmDrivenSinceService.toLocaleString()} km driven since last service).`
          : `3 Months servicing interval reached (${daysSinceService} days since last service).`;

        list.push({
          id: `servicing-due-${v.id}`,
          type: isMileageOverdue ? 'danger' : 'warning',
          category: 'Maintenance',
          vehicleId: v.id,
          plateNumber: v.plateNumber,
          title: `Routine Servicing Overdue: ${v.plateNumber}`,
          description: `Maintenance required: ${reason}`,
          date: v.lastServiceDate || currentMockDateStr,
          daysDiff: -daysSinceService,
          actionLabel: 'Schedule Service',
          actionType: 'maintenance'
        });
      }
    });

    // 4. Pending Maintenance Schedules
    maintenanceLogs.forEach(log => {
      if (log.status === 'Pending') {
        const diff = getDaysDifference(log.serviceDate);
        const v = vehicles.find(unit => unit.id === log.vehicleId);
        if (!v) return;
        
        if (diff < 0) {
          list.push({
            id: `maint-overdue-${log.id}`,
            type: 'danger',
            category: 'Inspection',
            vehicleId: v.id,
            plateNumber: v.plateNumber,
            title: `Overdue Service: ${v.plateNumber}`,
            description: `Scheduled "${log.serviceType}" was due on ${log.serviceDate} (${Math.abs(diff)} days ago).`,
            date: log.serviceDate,
            daysDiff: diff,
            actionLabel: 'Complete Service',
            logId: log.id,
            actionType: 'maintenance'
          });
        } else if (diff <= systemSettings.serviceReminderThreshold) {
          list.push({
            id: `maint-upcoming-${log.id}`,
            type: 'info',
            category: 'Maintenance',
            vehicleId: v.id,
            plateNumber: v.plateNumber,
            title: `Upcoming Service: ${v.plateNumber}`,
            description: `Scheduled "${log.serviceType}" is coming up on ${log.serviceDate} (in ${diff} days).`,
            date: log.serviceDate,
            daysDiff: diff,
            actionLabel: 'Complete Service',
            logId: log.id,
            actionType: 'maintenance'
          });
        }
      }
    });

    return list.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [vehicles, maintenanceLogs, fuelLogs, systemSettings]);

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

  // Status Distribution Chart data
  const statusChartData = useMemo(() => {
    const totals = { Active: 0, 'In Service': 0, Maintenance: 0, 'Out of Service': 0 };
    vehicles.forEach(v => {
      if (v.status in totals) {
        totals[v.status as keyof typeof totals]++;
      }
    });
    return totals;
  }, [vehicles]);

  // Handle reassign
  const handleOpenReassign = (vehicle: Vehicle) => {
    setReassignTargetVehicle(vehicle);
    setReassignForm({
      stationId: vehicle.stationId,
      currentDriver: vehicle.currentDriver
    });
    setIsReassignOpen(true);
  };

  const handleSaveReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTargetVehicle) return;
    reassignVehicle(reassignTargetVehicle.id, reassignForm.stationId, reassignForm.currentDriver);
    setIsReassignOpen(false);
    setReassignTargetVehicle(null);
  };

  const handleFastRoadWorthy = (vId: string) => {
    const v = vehicles.find(u => u.id === vId);
    if (!v) return;
    const regDateInput = prompt(`Renew Road Worthy for ${v.plateNumber}\nEnter registration date of renewal (YYYY-MM-DD):`, currentMockDateStr);
    if (regDateInput) {
      const dateObj = new Date(regDateInput + 'T00:00:00');
      if (isNaN(dateObj.getTime())) {
        alert('Invalid date format! Please use YYYY-MM-DD.');
        return;
      }
      dateObj.setFullYear(dateObj.getFullYear() + 1);
      const newExpiryDate = dateObj.toISOString().split('T')[0];

      const inspectionLog: MaintenanceLog = {
        id: `m-rw-${Date.now()}`,
        vehicleId: vId,
        serviceDate: regDateInput,
        serviceType: 'Road Worthy Inspection & Certification',
        cost: 250,
        notes: `Official DVLA inspection performed. Certificate renewed. Registered on ${regDateInput}.`,
        status: 'Completed',
        partsReplaced: []
      };
      renewRoadWorthy(vId, newExpiryDate, inspectionLog);
      alert(`Road Worthy certificate renewed! Expiry set exactly one year later: ${newExpiryDate}`);
    }
  };

  const handleFastInsurance = (vId: string) => {
    const v = vehicles.find(u => u.id === vId);
    if (!v) return;
    const newPolicy = prompt(`Renew Annual Insurance Policy for ${v.plateNumber}\nEnter Policy Number:`, v.insurancePolicyNumber || `POL-ENT-${Date.now().toString().slice(-4)}`);
    if (!newPolicy) return;
    const newCompany = prompt(`Insurance Company:`, v.insuranceCompany || 'Enterprise Insurance Co. Ltd');
    if (!newCompany) return;

    // Extend 1 year from current date
    const dateObj = new Date(currentMockDateStr + 'T00:00:00');
    dateObj.setFullYear(dateObj.getFullYear() + 1);
    const newExpiry = dateObj.toISOString().split('T')[0];

    renewInsurance(vId, newExpiry, newPolicy, newCompany);
    alert(`Insurance policy successfully renewed with ${newCompany}! New Expiry: ${newExpiry}`);
  };

  const handleFastMaintenance = (logId?: string, vId?: string) => {
    if (logId) {
      const log = maintenanceLogs.find(l => l.id === logId);
      if (!log) return;
      const confirmCost = prompt(`Complete Service: "${log.serviceType}"\nEnter actual maintenance cost (GHS):`, String(log.cost));
      if (confirmCost === null) return;
      const partsIn = prompt('Enter any replaced parts (comma-separated, e.g. Brakes, Tires, AC Filter):', '');
      const partsArray = partsIn ? partsIn.split(',').map(p => p.trim()).filter(Boolean) : [];
      const otherWork = prompt('Other work done (optional details):', log.otherWorkDone || '');
      resolveMaintenance(logId, Number(confirmCost) || log.cost, partsArray, otherWork || undefined);
    } else if (vId) {
      const v = vehicles.find(u => u.id === vId);
      if (!v) return;
      alert(`Navigating to Maintenance portal to record service for unit ${v.plateNumber}.`);
      window.location.href = `/maintenance?vId=${vId}`;
    }
  };

  return (
    <>
      <div className="view-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="no-print">
          {/* KEY STATS COUNTERS */}
          <div className="stats-grid">
            <div className="glass-panel stat-card">
              <div className="stat-icon" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                <Car style={{ height: '24px', width: '24px', color: 'var(--primary-gold)' }} />
              </div>
              <p className="stat-label">Fleet Total Units</p>
              <h3 className="stat-value">{vehicles.length}</h3>
              <div className="stat-desc">
                <span style={{ color: 'var(--success)', fontWeight: '600' }}>100% Registered & Active</span>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <CheckCircle2 style={{ height: '24px', width: '24px', color: 'var(--success)' }} />
              </div>
              <p className="stat-label">Active Drivers</p>
              <h3 className="stat-value">
                {vehicles.filter(v => v.currentDriver && v.currentDriver !== 'Unassigned (In Shop)' && v.currentDriver !== 'Unassigned').length}
              </h3>
              <div className="stat-desc">
                <span>Stationed across 4 regions</span>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <Wrench style={{ height: '24px', width: '24px', color: 'var(--warning)' }} />
              </div>
              <p className="stat-label">Under Maintenance</p>
              <h3 className="stat-value">
                {vehicles.filter(v => v.status === 'Maintenance' || v.status === 'Out of Service').length}
              </h3>
              <div className="stat-desc">
                <span style={{ color: 'var(--warning)', fontWeight: '600' }}>
                  {maintenanceLogs.filter(l => l.status === 'Pending').length} pending service tasks
                </span>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertTriangle style={{ height: '24px', width: '24px', color: 'var(--danger)' }} />
              </div>
              <p className="stat-label">Critical Expiries</p>
              <h3 className="stat-value">
                {vehicles.filter(v => getDaysDifference(v.roadWorthyExpiry) < 0 || getDaysDifference(v.insuranceExpiryDate) < 0).length}
              </h3>
              <div className="stat-desc" style={{ color: 'var(--danger)', fontWeight: '600', animation: 'pulseGlow 1.5s infinite ease-in-out' }}>
                <span>Requires immediate action</span>
              </div>
            </div>
          </div>

          {/* REAL-TIME ALERTS CENTER */}
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <AlertTriangle style={{ height: '20px', width: '20px', color: 'var(--warning)' }} />
                <div>
                  <h4>Automated System Alerts Center</h4>
                  <p>{alerts.length} operational alerts flagged (Road Worthy, Insurance & 3-Month / 5,000km Maintenance)</p>
                </div>
              </div>
            </div>
            
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <CheckCircle2 style={{ height: '32px', width: '32px', color: 'var(--success)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.9rem' }}>All vehicle systems optimal. No alerts found.</p>
              </div>
            ) : (
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-card ${alert.type}`}>
                    <div className="alert-info-wrapper">
                      <div className={`alert-indicator ${alert.type}`}></div>
                      <div className="alert-details">
                        <h5>
                          {alert.title}
                          <span className="alert-category">{alert.category}</span>
                        </h5>
                        <p className="alert-desc">{alert.description}</p>
                      </div>
                    </div>

                    {alert.actionLabel && (
                      <button 
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '6px 12px', flexShrink: 0 }}
                        onClick={() => {
                          if (alert.actionType === 'insurance') {
                            handleFastInsurance(alert.vehicleId);
                          } else if (alert.actionType === 'roadWorthy') {
                            handleFastRoadWorthy(alert.vehicleId);
                          } else {
                            handleFastMaintenance(alert.logId, alert.vehicleId);
                          }
                        }}
                      >
                        {alert.actionLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DASHBOARD BOTTOM SPLIT GRID */}
          <div className="dashboard-split">
            {/* Left: Quick Dispatch & Station Overview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Quick Fleet Dispatch Matrix Table */}
              <div className="glass-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <Car style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                    <div>
                      <h4>Quick Dispatch Fleet Overview</h4>
                      <p>Active fleet registry units and operational status</p>
                    </div>
                  </div>
                </div>

                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Plate Number</th>
                        <th>Chassis Number</th>
                        <th>Brand & Model</th>
                        <th>Station Depot</th>
                        <th>Operator</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.slice(0, 6).map(vehicle => {
                        const stationObj = stations.find(s => s.id === vehicle.stationId);
                        return (
                          <tr key={vehicle.id}>
                            <td>
                              <strong style={{ color: 'var(--primary-gold)' }}>{vehicle.plateNumber}</strong>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {vehicle.chassisNumber || 'N/A'}
                            </td>
                            <td>{vehicle.make} {vehicle.model}</td>
                            <td>{stationObj?.name || vehicle.stationId}</td>
                            <td>{vehicle.currentDriver}</td>
                            <td>
                              <span className={`badge ${
                                vehicle.status === 'Active' ? 'badge-active' :
                                vehicle.status === 'In Service' ? 'badge-service' :
                                vehicle.status === 'Maintenance' ? 'badge-maintenance' : 'badge-out'
                              }`}>
                                {vehicle.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                onClick={() => handleOpenReassign(vehicle)}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                              >
                                Reassign
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Operational Status & Aggregated Parts Counter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Fleet Status Breakdown */}
              <div className="glass-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <Sliders style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                    <div>
                      <h4>Operational Status Matrix</h4>
                      <p>Vehicle allocation breakdown</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {Object.entries(statusChartData).map(([statusKey, count]) => {
                    const percentage = vehicles.length > 0 ? Math.round((count / vehicles.length) * 100) : 0;
                    const colorClass = 
                      statusKey === 'Active' ? 'var(--success)' :
                      statusKey === 'In Service' ? 'var(--info)' :
                      statusKey === 'Maintenance' ? 'var(--warning)' : 'var(--danger)';

                    return (
                      <div key={statusKey} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-bright)' }}>{statusKey}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{count} units ({percentage}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-inset)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percentage}%`, height: '100%', background: colorClass, borderRadius: '4px', transition: 'width 0.5s ease-in-out' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Aggregated Replacement Parts Swapped Matrix */}
              <div className="glass-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <Wrench style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                    <div>
                      <h4>Parts Replaced Counter Matrix</h4>
                      <p>Total swapped components across fleet</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getPartReplacementCounts().slice(0, 5).map(item => (
                    <div 
                      key={item.partName}
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-inset)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span style={{ color: 'var(--text-bright)', fontWeight: '500' }}>{item.partName}</span>
                      <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                        {item.count} swapped
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* --- QUICK REASSIGNMENT MODAL --- */}
      {isReassignOpen && reassignTargetVehicle && (
        <div className="modal-overlay no-print" onClick={() => setIsReassignOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quick Fleet Reassignment: {reassignTargetVehicle.plateNumber}</h3>
              <button onClick={() => setIsReassignOpen(false)} className="modal-close-btn">
                <X style={{ height: '18px', width: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveReassign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-row">
                <label>Assigned Depot Station</label>
                <select 
                  className="form-select"
                  value={reassignForm.stationId}
                  onChange={(e) => setReassignForm(prev => ({ ...prev, stationId: e.target.value }))}
                >
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Assigned Driver Operator</label>
                <DriverSelect 
                  value={reassignForm.currentDriver}
                  onChange={(val) => setReassignForm(prev => ({ ...prev, currentDriver: val }))}
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsReassignOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Dispatch Reassignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
