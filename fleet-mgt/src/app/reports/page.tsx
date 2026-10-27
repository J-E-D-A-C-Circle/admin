'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Download, 
  Printer, 
  Calendar 
} from 'lucide-react';
import { useFleet } from '@/context/FleetContext';
import { MaintenanceLog, Vehicle, FuelLog } from '@/types/fleet';

function ReportsPageContent() {
  const { 
    vehicles, 
    fuelLogs, 
    maintenanceLogs, 
    stations 
  } = useFleet();

  const searchParams = useSearchParams();
  const vParam = searchParams.get('vId');

  // Report Selection States
  const [reportVehicleId, setReportVehicleId] = useState<string>('1');
  const [reportMonth, setReportMonth] = useState<string>('2026-06'); // Format: YYYY-MM

  // Pre-fill from query parameter if available
  useEffect(() => {
    if (vParam && vehicles.some(v => v.id === vParam)) {
      setReportVehicleId(vParam);
    }
  }, [vParam, vehicles]);

  const currentMockDateStr = '2026-06-12';

  // Fuel Efficiency calculations for report
  const getOdometerStats = (vId: string, monthStr: string) => {
    let logs = fuelLogs.filter(f => f.vehicleId === vId);
    logs = logs.filter(f => f.date.startsWith(monthStr));
    
    const liters = logs.reduce((sum, l) => sum + l.liters, 0);
    const cost = logs.reduce((sum, l) => sum + l.cost, 0);
    
    const sortedAll = [...fuelLogs].filter(f => f.vehicleId === vId).sort((a,b) => a.odometerReading - b.odometerReading);
    const vehicle = vehicles.find(v => v.id === vId);
    
    if (logs.length === 0) {
      const currentMil = sortedAll.length > 0 ? sortedAll[sortedAll.length - 1].odometerReading : (vehicle ? vehicle.baseMileage : 0);
      return { distance: 0, liters: 0, cost: 0, efficiency: 0, currentOdometer: currentMil };
    }
    
    const sortedMonth = [...logs].sort((a,b) => a.odometerReading - b.odometerReading);
    const minOdo = sortedMonth[0].odometerReading;
    const maxOdo = sortedMonth[sortedMonth.length - 1].odometerReading;
    
    const firstMonthIndex = sortedAll.findIndex(f => f.id === sortedMonth[0].id);
    const prevOdo = firstMonthIndex > 0 ? sortedAll[firstMonthIndex - 1].odometerReading : (vehicle ? vehicle.baseMileage : minOdo);
    const distance = maxOdo - prevOdo;
    
    const efficiency = distance > 0 && liters > 0 ? (liters * 100) / distance : 0;
    const currentMil = sortedAll.length > 0 ? sortedAll[sortedAll.length - 1].odometerReading : (vehicle ? vehicle.baseMileage : 0);
    return { distance, liters, cost, efficiency, currentOdometer: currentMil };
  };

  // Compile Report Data
  const compiledReportData = useMemo(() => {
    const vehicle = vehicles.find(v => v.id === reportVehicleId);
    if (!vehicle) return null;
    
    const stats = getOdometerStats(reportVehicleId, reportMonth);
    const monthMaint = maintenanceLogs.filter(log => log.vehicleId === reportVehicleId && log.serviceDate.startsWith(reportMonth));
    
    const partsMap: { [key: string]: number } = {};
    monthMaint.forEach(log => {
      if (log.status === 'Completed') {
        log.partsReplaced.forEach(p => {
          if (p.trim()) partsMap[p] = (partsMap[p] || 0) + 1;
        });
      }
    });
    const monthParts = Object.entries(partsMap).map(([partName, count]) => ({ partName, count }));
    
    return {
      vehicle,
      stats,
      monthMaint,
      monthParts
    };
  }, [vehicles, fuelLogs, maintenanceLogs, reportVehicleId, reportMonth]);

  // Export Monthly Report as CSV
  const handleExportCSV = () => {
    if (!compiledReportData) return;
    const { vehicle, stats, monthMaint, monthParts } = compiledReportData;

    let csvContent = `data:text/csv;charset=utf-8,`;
    csvContent += `DVLA FLEET MANAGEMENT SYSTEM - MONTHLY PERFORMANCE REPORT\n`;
    csvContent += `Report Period,${reportMonth}\n`;
    csvContent += `Vehicle,${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})\n`;
    csvContent += `Chassis Number,${vehicle.chassisNumber}\n`;
    csvContent += `Current Station,${stations.find(s => s.id === vehicle.stationId)?.name || vehicle.stationId}\n`;
    csvContent += `Current Driver,${vehicle.currentDriver}\n\n`;
    
    csvContent += `FUEL STATISTICS SUMMARY\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Total Fuel Consumed (Liters),${stats.liters} L\n`;
    csvContent += `Total Fuel Cost (GHS),${stats.cost} GHS\n`;
    csvContent += `Total Mileage Driven (km),${stats.distance} km\n`;
    csvContent += `Fuel Consumption Efficiency,${stats.efficiency ? stats.efficiency.toFixed(2) + ' L/100km' : 'N/A'}\n\n`;
    
    csvContent += `MAINTENANCE WORK COMPLETED\n`;
    csvContent += `Date,Service Type,Cost (GHS),Parts Swapped,Notes\n`;
    if (monthMaint.length === 0) {
      csvContent += `N/A,No maintenance events logged in this period,0,N/A,N/A\n`;
    } else {
      monthMaint.forEach(log => {
        csvContent += `"${log.serviceDate}","${log.serviceType}",${log.cost},"${log.partsReplaced.join('; ')}","${log.notes.replace(/"/g, '""')}"\n`;
      });
    }
    
    csvContent += `\nPARTS REPLACEMENT TALLY\n`;
    csvContent += `Part Name,Times Replaced\n`;
    if (monthParts.length === 0) {
      csvContent += `N/A,0\n`;
    } else {
      monthParts.forEach(p => {
        csvContent += `"${p.partName}",${p.count}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DVLA_Report_${vehicle.plateNumber}_${reportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* VIEW CONTAINER */}
      <div className="view-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* FILTERING CONTROLS - Hidden in print */}
          <div className="glass-panel toolbar no-print">
            <div className="search-filter-group">
              <div className="form-row">
                <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '655' }}>Select Vehicle</label>
                <select 
                  className="form-select"
                  style={{ fontSize: '0.75rem', width: '220px', padding: '8px 12px' }}
                  value={reportVehicleId}
                  onChange={(e) => setReportVehicleId(e.target.value)}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plateNumber} &bull; {v.make} {v.model}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '655' }}>Select Month</label>
                <select 
                  className="form-select"
                  style={{ fontSize: '0.75rem', width: '150px', padding: '8px 12px' }}
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                >
                  <option value="2026-04">April 2026</option>
                  <option value="2026-05">May 2026</option>
                  <option value="2026-06">June 2026</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleExportCSV}
                className="btn btn-secondary"
                disabled={!compiledReportData}
              >
                <Download style={{ height: '14px', width: '14px' }} />
                <span>Export CSV</span>
              </button>
              
              <button 
                onClick={handlePrint}
                className="btn btn-primary"
                disabled={!compiledReportData}
              >
                <Printer style={{ height: '14px', width: '14px' }} />
                <span>Print Report</span>
              </button>
            </div>
          </div>

          {/* OFFICIAL PRINTABLE REPORT CONTAINER */}
          {compiledReportData ? (
            <div className="report-card print-area" id="official-report-card">
              {/* DVLA OFFICIAL SEAL & LETTERHEAD */}
              <div className="report-header">
                <div className="report-brand-area">
                  <svg width="55" height="55" viewBox="0 0 100 100" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="50" cy="50" r="48" fill="#0c1228" stroke="#d4af37" strokeWidth="4"/>
                    <circle cx="50" cy="50" r="42" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3"/>
                    <path d="M30 45 L50 25 L70 45 L50 65 Z" fill="#d4af37" opacity="0.3"/>
                    <text x="50" y="38" fill="#d4af37" fontSize="8" fontWeight="bold" textAnchor="middle">DVLA</text>
                    <text x="50" y="80" fill="#ffffff" fontSize="6" fontWeight="semibold" letterSpacing="1" textAnchor="middle">GHANA</text>
                    <rect x="42" y="45" width="16" height="18" rx="2" fill="#d4af37"/>
                    <path d="M46 50 L54 50 M46 54 L54 54 M46 58 L52 58" stroke="#000000" strokeWidth="1.5"/>
                  </svg>
                  <div className="report-brand-title">
                    <h2>DRIVER & VEHICLE LICENSING AUTHORITY</h2>
                    <p>Official Unit Performance & Maintenance Certificate</p>
                    <span>Generated Date: {currentMockDateStr} &bull; Operational Report Feed</span>
                  </div>
                </div>
                <div className="report-header-meta">
                  <p className="meta-plate">UNIT: {compiledReportData.vehicle.plateNumber}</p>
                  <p>Period: <strong style={{ color: 'var(--text-title)' }} className="print:text-black">{reportMonth}</strong></p>
                </div>
              </div>

              {/* VEHICLE METADATA CARDS */}
              <div className="report-meta-grid">
                <div className="report-meta-item">
                  <span>Vehicle Details</span>
                  <strong>{compiledReportData.vehicle.make} {compiledReportData.vehicle.model}</strong>
                  <p>Designation: {compiledReportData.vehicle.designation || 'Operational'}</p>
                </div>

                <div className="report-meta-item">
                  <span>Chassis Number</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{compiledReportData.vehicle.chassisNumber}</strong>
                  <p>Mfg / Purchase: {compiledReportData.vehicle.yearOfManufacture || 'N/A'} / {compiledReportData.vehicle.yearOfPurchase || 'N/A'}</p>
                </div>

                <div className="report-meta-item">
                  <span>Assigned Station</span>
                  <strong>
                    {stations.find(s => s.id === compiledReportData.vehicle.stationId)?.name || compiledReportData.vehicle.stationId}
                  </strong>
                  <p>Region: {stations.find(s => s.id === compiledReportData.vehicle.stationId)?.location}</p>
                </div>

                <div className="report-meta-item">
                  <span>Assigned Operator</span>
                  <strong>{compiledReportData.vehicle.currentDriver}</strong>
                  <p>Status: {compiledReportData.vehicle.status}</p>
                </div>
              </div>

              {/* FUEL CONSUMPTION METRIC TILES */}
              <div>
                <h3 className="report-section-title">I. Monthly Fuel Tracking Analysis</h3>
                <div className="report-fuel-grid">
                  <div className="report-fuel-tile">
                    <span>Total Distance</span>
                    <h4>{compiledReportData.stats.distance} km</h4>
                    <p>Odo: {compiledReportData.stats.currentOdometer.toLocaleString()} km</p>
                  </div>

                  <div className="report-fuel-tile">
                    <span>Fuel Consumed</span>
                    <h4>{compiledReportData.stats.liters} Liters</h4>
                    <p>Fillups logged: {fuelLogs.filter(f => f.vehicleId === reportVehicleId && f.date.startsWith(reportMonth)).length}</p>
                  </div>

                  <div className="report-fuel-tile">
                    <span>Fuel Expense</span>
                    <h4>{compiledReportData.stats.cost.toLocaleString()} GHS</h4>
                    <p>Est base: 15.00 GHS/L</p>
                  </div>

                  <div className="report-fuel-tile">
                    <span>Avg Fuel Efficiency</span>
                    <h4>
                      {compiledReportData.stats.efficiency ? `${compiledReportData.stats.efficiency.toFixed(1)} L/100km` : 'N/A'}
                    </h4>
                    <p>
                      {compiledReportData.stats.efficiency ? `${(282.48 / compiledReportData.stats.efficiency).toFixed(1)} MPG` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* MAINTENANCE LOGS SUMMARY */}
              <div>
                <h3 className="report-section-title">II. Maintenance Activities Log</h3>
                
                {compiledReportData.monthMaint.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px', background: 'var(--bg-inset)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    No maintenance operations scheduled or completed in this period.
                  </p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table" style={{ fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Service Category</th>
                          <th>Cost (GHS)</th>
                          <th>Status</th>
                          <th>Technician Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compiledReportData.monthMaint.map(log => (
                          <tr key={log.id}>
                            <td>{log.serviceDate}</td>
                            <td><strong style={{ color: 'var(--text-title)' }} className="print:text-black">{log.serviceType}</strong></td>
                            <td style={{ fontWeight: '650' }}>{log.cost.toLocaleString()} GHS</td>
                            <td>
                              <span className={`badge ${log.status === 'Completed' ? 'badge-active' : 'badge-maintenance'}`}>
                                {log.status}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>{log.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PARTS REPLACED SUMMARY */}
              <div>
                <h3 className="report-section-title">III. Parts Swapped Matrix</h3>
                
                {compiledReportData.monthParts.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px', background: 'var(--bg-inset)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    No parts replacements logged in this period.
                  </p>
                ) : (
                  <div className="parts-swapped-grid">
                    {compiledReportData.monthParts.map((p, idx) => (
                      <div key={idx} style={{ padding: '10px 14px', background: 'var(--bg-inset)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-bright)' }} className="print:text-black">{p.partName}</span>
                        <span style={{ fontWeight: '700', color: 'var(--primary-gold)' }}>{p.count} swap(s)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FOOTER SIGNATURES */}
              <div className="report-sign-area" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '36px' }}>
                <div className="signature-block">
                  <div className="signature-line" style={{ height: '36px', borderBottom: '1px solid var(--border-color)' }}>
                    {/* Blank line for Chief Driver signature */}
                  </div>
                  <strong>Chief Driver</strong>
                  <p>DVLA Transport Unit</p>
                </div>

                <div className="signature-block" style={{ textAlign: 'center' }}>
                  <div className="signature-line" style={{ height: '36px', borderBottom: '1px solid var(--border-color)' }}>
                    {/* Blank line for Assistant Manager signature */}
                  </div>
                  <strong>Assistant Manager</strong>
                  <p>Fleet & Operations Branch</p>
                </div>

                <div className="signature-block" style={{ textAlign: 'right' }}>
                  <div className="signature-line" style={{ height: '36px', borderBottom: '1px solid var(--border-color)' }}>
                    {/* Blank line for Manager Transport signature */}
                  </div>
                  <strong>Manager Transport</strong>
                  <p>DVLA Headquarters</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }} className="glass-panel">
              <p>No report could be compiled. Select another vehicle or date range.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="glass-panel" style={{ textAlign: 'center', padding: '32px' }}>Loading Report Parameters...</div>}>
      <ReportsPageContent />
    </Suspense>
  );
}
