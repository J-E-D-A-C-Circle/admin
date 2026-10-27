'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Fuel, 
  TrendingUp, 
  Calendar 
} from 'lucide-react';
import { useFleet } from '@/context/FleetContext';
import { FuelLog } from '@/types/fleet';

export default function FuelPage() {
  const { 
    vehicles, 
    fuelLogs, 
    addFuel 
  } = useFleet();

  // Search/Filter State
  const [fuelSearch, setFuelSearch] = useState('');

  // Form State
  const [fuelForm, setFuelForm] = useState({
    vehicleId: '1',
    date: '2026-06-12',
    liters: 0,
    cost: 0,
    odometerReading: 0
  });

  const currentMockDateStr = '2026-06-12';

  // Fuel Efficiency calculations
  const getOdometerStats = (vId: string) => {
    const logs = fuelLogs.filter(f => f.vehicleId === vId);
    const sortedAll = [...fuelLogs].filter(f => f.vehicleId === vId).sort((a,b) => a.odometerReading - b.odometerReading);
    const vehicle = vehicles.find(v => v.id === vId);
    
    const liters = logs.reduce((sum, l) => sum + l.liters, 0);
    
    if (sortedAll.length === 0) {
      return { distance: 0, liters: 0, cost: 0, efficiency: 0, currentOdometer: vehicle ? vehicle.baseMileage : 0 };
    }
    
    const base = vehicle ? vehicle.baseMileage : sortedAll[0].odometerReading;
    const latestOdo = sortedAll[sortedAll.length - 1].odometerReading;
    const distance = latestOdo - base;
    const efficiency = distance > 0 && liters > 0 ? (liters * 100) / distance : 0;
    
    return { distance, liters, efficiency, currentOdometer: latestOdo };
  };

  // Handle Save
  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vStats = getOdometerStats(fuelForm.vehicleId);
    if (Number(fuelForm.odometerReading) <= vStats.currentOdometer) {
      alert(`Invalid Odometer! Reading must be higher than current odometer of ${vStats.currentOdometer.toLocaleString()} km.`);
      return;
    }

    const newLog: FuelLog = {
      id: `f-${Date.now()}`,
      vehicleId: fuelForm.vehicleId,
      date: fuelForm.date,
      liters: Number(fuelForm.liters) || 0,
      cost: Number(fuelForm.cost) || 0,
      odometerReading: Number(fuelForm.odometerReading)
    };

    addFuel(newLog);
    
    // Reset Form
    setFuelForm({
      vehicleId: vehicles[0]?.id || '1',
      date: currentMockDateStr,
      liters: 0,
      cost: 0,
      odometerReading: 0
    });
  };

  // Filter fuel logs
  const filteredFuel = useMemo(() => {
    return fuelLogs.filter(log => {
      const v = vehicles.find(unit => unit.id === log.vehicleId);
      const plate = v ? v.plateNumber : '';
      return plate.toLowerCase().includes(fuelSearch.toLowerCase()) || 
             log.date.includes(fuelSearch);
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [fuelLogs, vehicles, fuelSearch]);

  return (
    <>
      {/* VIEW CONTAINER */}
      <div className="view-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="no-print">
          {/* FUEL SUMMARY GRAPH AND FORM TRAY */}
          <div className="fuel-layout-grid">
            {/* Form to log fuel fillup */}
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Fuel style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                  <div>
                    <h4>Log Fuel Dispatch</h4>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSaveFuel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row">
                  <label>Select Fleet Unit</label>
                  <select 
                    className="form-select"
                    value={fuelForm.vehicleId}
                    onChange={(e) => setFuelForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plateNumber} - {v.make} {v.model}</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Date</label>
                    <input 
                      type="date" 
                      className="form-input"
                      value={fuelForm.date}
                      onChange={(e) => setFuelForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Liters Filled</label>
                    <input 
                      type="number" 
                      min="1"
                      step="0.1"
                      placeholder="e.g. 50"
                      className="form-input"
                      value={fuelForm.liters || ''}
                      onChange={(e) => setFuelForm(prev => ({ ...prev, liters: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-row">
                    <label>Total Cost (GHS)</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Cost in Cedis"
                      className="form-input"
                      value={fuelForm.cost || ''}
                      onChange={(e) => setFuelForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Odometer (km)</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Odometer reading"
                      className="form-input"
                      value={fuelForm.odometerReading || ''}
                      onChange={(e) => setFuelForm(prev => ({ ...prev, odometerReading: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Latest Registered Mileage:</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', marginTop: '4px', display: 'block' }}>
                    {getOdometerStats(fuelForm.vehicleId).currentOdometer.toLocaleString()} km
                  </strong>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Submit Fuel Log
                </button>
              </form>
            </div>

            {/* Fuel efficiency SVG Bar Chart */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="panel-header">
                <div className="panel-title">
                  <TrendingUp style={{ height: '20px', width: '20px', color: 'var(--primary-gold)' }} />
                  <div>
                    <h4>Vehicle Fuel Efficiency Benchmark</h4>
                    <p>Fuel consumption rate benchmarked in L/100km. Lower is more efficient.</p>
                  </div>
                </div>
              </div>

              {/* SVG Chart */}
              <div className="chart-body-wrapper">
                {vehicles.map(v => {
                  const stats = getOdometerStats(v.id);
                  const displayVal = stats.efficiency ? stats.efficiency : 0;
                  const barHeight = Math.min((displayVal / 20) * 128, 128);
                  
                  const barColorClass = 
                    displayVal === 0 ? 'good' :
                    displayVal <= 10 ? 'good' :
                    displayVal <= 15 ? 'warning' : 'bad';
                  
                  return (
                    <div key={v.id} className="chart-bar-column">
                      <div className="chart-bar-value-label">
                        {displayVal ? displayVal.toFixed(1) : 'N/A'}
                      </div>
                      
                      <div className="chart-bar-track">
                        {displayVal > 0 ? (
                          <div 
                            className={`chart-bar-fill ${barColorClass}`} 
                            style={{ height: `${barHeight}px` }}
                          ></div>
                        ) : (
                          <div style={{ width: '100%', background: '#374151', height: '2px' }}></div>
                        )}
                      </div>
                      
                      <span className="chart-bar-label" title={v.plateNumber}>
                        {v.plateNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="chart-legend">
                <span>&bull; Optimal: &lt; 10 L/100km (Green)</span>
                <span>&bull; Moderate: 10 - 15 L/100km (Yellow)</span>
                <span>&bull; Heavy: &gt; 15 L/100km (Red)</span>
              </div>
            </div>
          </div>

          {/* FUEL HISTORY TABLE */}
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <h4>Fuel Fill-up Registry Logs</h4>
              </div>
              <div className="search-input-wrapper" style={{ width: '220px' }}>
                <Search className="search-icon" style={{ height: '14px', width: '14px', top: '10px' }} />
                <input 
                  type="text" 
                  placeholder="Filter by plate or date..." 
                  className="form-input"
                  style={{ padding: '8px 12px 8px 32px', fontSize: '0.75rem' }}
                  value={fuelSearch}
                  onChange={(e) => setFuelSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle Plate</th>
                    <th>Model</th>
                    <th>Liters Filled</th>
                    <th>Fuel Cost (GHS)</th>
                    <th>Odometer Reading</th>
                    <th>Cost/Liter</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFuel.map(log => {
                    const unit = vehicles.find(v => v.id === log.vehicleId);
                    const costPerLiter = log.liters > 0 ? (log.cost / log.liters).toFixed(2) : '0';
                    return (
                      <tr key={log.id}>
                        <td style={{ fontWeight: '500' }}>{log.date}</td>
                        <td><strong style={{ color: 'var(--text-title)' }}>{unit ? unit.plateNumber : 'Unknown'}</strong></td>
                        <td>{unit?.make} {unit?.model}</td>
                        <td>{log.liters} L</td>
                        <td style={{ fontWeight: '650', color: 'var(--text-title)' }}>{log.cost.toLocaleString()} GHS</td>
                        <td>{log.odometerReading.toLocaleString()} km</td>
                        <td style={{ color: 'var(--text-muted)' }}>{costPerLiter} GHS/L</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredFuel.length === 0 && (
              <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No fuel fillup events logged.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
