'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  FileBarChart2,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  BarChart3,
  MapPin,
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  Briefcase,
  Eye,
  X,
  TrendingUp,
  CheckCircle2,
  Users,
  Archive,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#10b981', '#f59e0b', '#38bdf8', '#a855f7', '#ef4444', '#64748b', '#ec4899'];
const STATUS_COLORS: Record<string, string> = {
  Active: '#10b981',
  'Under Maintenance': '#f59e0b',
  Damaged: '#f97316',
  Missing: '#ef4444',
  Obsolete: '#64748b',
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

const reportTypes: ReportType[] = [
  {
    key: 'inventory',
    label: 'Inventory Report',
    description: 'Full inventory list by region, station, department, or category.',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-blue-400',
  },
  {
    key: 'movement',
    label: 'Movement / Transfer Report',
    description: 'All asset transfers within a date range.',
    icon: <MapPin className="w-6 h-6" />,
    color: 'text-amber-400',
  },
  {
    key: 'missing',
    label: 'Missing Assets Report',
    description: 'All assets currently marked as Missing.',
    icon: <AlertTriangle className="w-6 h-6" />,
    color: 'text-red-400',
  },
  {
    key: 'damaged',
    label: 'Damaged Assets Report',
    description: 'All assets currently marked as Damaged.',
    icon: <Wrench className="w-6 h-6" />,
    color: 'text-orange-400',
  },
  {
    key: 'obsolete',
    label: 'Obsolete & Disposal Report',
    description: 'All obsolete assets, disposal methods, and realised values.',
    icon: <Archive className="w-6 h-6" />,
    color: 'text-slate-400',
  },
  {
    key: 'verification',
    label: 'Verification Report',
    description: 'Summary of all verification exercises by period.',
    icon: <ClipboardCheck className="w-6 h-6" />,
    color: 'text-emerald-400',
  },
  {
    key: 'executive',
    label: 'Executive Summary',
    description: 'High-level KPIs and summary statistics for management.',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'text-purple-400',
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [lookups, setLookups] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [regionId, setRegionId] = useState('');
  const [stationId, setStationId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Drawer states
  const [drawerAssetId, setDrawerAssetId] = useState<string | null>(null);
  const [drawerAsset, setDrawerAsset] = useState<any>(null);
  const [drawerHistory, setDrawerHistory] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'info' | 'history'>('info');

  React.useEffect(() => {
    api.getLookups().then(setLookups).catch(console.error);
  }, []);

  const openDrawer = async (assetId: string) => {
    setDrawerAssetId(assetId);
    setDrawerLoading(true);
    setDrawerTab('info');
    try {
      const [asset, history] = await Promise.all([
        api.getAsset(assetId),
        api.getAssetHistory(assetId),
      ]);
      setDrawerAsset(asset);
      setDrawerHistory(history);
    } catch (err) {
      console.error('Error loading asset details:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerAssetId(null);
    setDrawerAsset(null);
    setDrawerHistory([]);
  };

  const filteredStations = regionId && lookups?.stations
    ? lookups.stations.filter((s: any) => s.regionId === parseInt(regionId))
    : lookups?.stations || [];

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (regionId) params.regionId = regionId;
      if (stationId) params.stationId = stationId;
      if (categoryId) params.categoryId = categoryId;

      const data = await api.getReport(selectedReport, params);
      if (Array.isArray(data)) {
        setResult({ data });
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!result || !Array.isArray(result.data)) return;
    const headers = Object.keys(result.data[0] || {}).join(',');
    const rows = result.data.map((row: any) =>
      Object.values(row).map((v) => `"${v !== null && v !== undefined ? String(v).replace(/"/g, '""') : ''}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!result || !Array.isArray(result.data)) return;
    const ws = XLSX.utils.json_to_sheet(result.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
    XLSX.writeFile(wb, `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!result || !Array.isArray(result.data)) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Header
    doc.setFillColor(15, 23, 42); // slate-900 bg
    doc.rect(0, 0, 297, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DVLA ASSET MANAGEMENT SYSTEM', 14, 18);
    
    doc.setTextColor(251, 191, 36); // amber-400 accent
    doc.setFontSize(12);
    doc.text((reportTypes.find((r) => r.key === selectedReport)?.label || 'Report').toUpperCase(), 14, 27);

    doc.setTextColor(156, 163, 175); // slate-400
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    const headers = Object.keys(result.data[0] || {});
    const body = result.data.map((row: any) =>
      headers.map((h) => String(row[h] !== null && row[h] !== undefined ? row[h] : ''))
    );

    autoTable(doc, {
      head: [headers.map(h => h.replace(/([A-Z])/g, ' $1').toUpperCase())],
      body: body,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [0, 150, 108], textColor: [255, 255, 255], fontStyle: 'bold' }, // Emerald theme
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`${selectedReport}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const selectClass =
    'w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-300 text-sm focus:outline-none';
  const inputClass =
    'w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-300 text-sm focus:outline-none';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Reports</h1>
        <p className="text-sm text-slate-400">Generate and export detailed asset reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((r) => (
          <button
            key={r.key}
            onClick={() => { setSelectedReport(r.key); setResult(null); }}
            className={`p-5 bg-slate-900 border rounded-xl text-left transition-all hover:border-slate-700 ${
              selectedReport === r.key
                ? 'border-amber-500 ring-1 ring-amber-500/30'
                : 'border-slate-800'
            }`}
          >
            <div className={`mb-3 ${r.color}`}>{r.icon}</div>
            <div className="text-sm font-semibold text-white mb-1">{r.label}</div>
            <div className="text-xs text-slate-500 leading-relaxed">{r.description}</div>
          </button>
        ))}
      </div>

      {selectedReport && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {reportTypes.find((r) => r.key === selectedReport)?.label} — Filters
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Region</label>
              <Select value={regionId || 'all'} onValueChange={(val) => { setRegionId(val === 'all' ? '' : val); setStationId(''); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {lookups?.regions?.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Station</label>
              <Select value={stationId || 'all'} onValueChange={(val) => setStationId(val === 'all' ? '' : val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Stations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stations</SelectItem>
                  {filteredStations.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <Select value={categoryId || 'all'} onValueChange={(val) => setCategoryId(val === 'all' ? '' : val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {lookups?.categories?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart2 className="w-4 h-4" />}
              <span>{loading ? 'Generating...' : 'Generate Report'}</span>
            </button>
            {result && Array.isArray(result.data) && result.data.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1.5 px-3 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center space-x-1.5 px-3 py-2 border border-emerald-800 text-emerald-400 hover:bg-emerald-950/20 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center space-x-1.5 px-3 py-2 border border-red-800 text-red-400 hover:bg-red-950/20 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-2 p-4 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {selectedReport === 'inventory' && result.summary && result.charts && (
            <div className="space-y-5">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Total Assets</span>
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{result.summary.totalAssets.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Top category: <span className="text-slate-200 font-medium">{result.summary.topCategory}</span>
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Total Value</span>
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">
                    GHS {Number(result.summary.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Top station: <span className="text-slate-200 font-medium">{result.summary.topStation}</span>
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Operational Readiness</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-emerald-400">{result.summary.activeRate}%</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {result.summary.activeCount} active • {result.summary.maintenanceCount + result.summary.damagedCount + result.summary.missingCount} need attention
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Custodian Assignment</span>
                    <Users className="w-4 h-4 text-sky-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{result.summary.assignedCount}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {result.summary.unassignedCount} unassigned • {result.summary.obsoleteCount} obsolete
                  </p>
                </div>
              </div>

              {/* Narrative Evaluation Banner */}
              <div className="bg-emerald-950/25 border border-emerald-800/40 rounded-xl p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">Report Evaluation: </span>
                  This inventory snapshot covers <span className="font-semibold text-white">{result.summary.totalAssets}</span> asset{result.summary.totalAssets === 1 ? '' : 's'} with a combined purchase value of{' '}
                  <span className="font-semibold text-amber-300">
                    GHS {Number(result.summary.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  . Operational readiness stands at <span className="font-semibold text-emerald-400">{result.summary.activeRate}%</span> ({result.summary.activeCount} Active).
                  {result.summary.maintenanceCount + result.summary.damagedCount + result.summary.missingCount > 0
                    ? ` ${result.summary.maintenanceCount} under maintenance, ${result.summary.damagedCount} damaged, and ${result.summary.missingCount} missing asset(s) require follow-up.`
                    : ' No assets are currently flagged as damaged, missing, or under maintenance.'}{' '}
                  Highest asset concentration is in <span className="font-semibold text-white">{result.summary.topCategory}</span> at <span className="font-semibold text-white">{result.summary.topStation}</span>.
                </div>
              </div>

              {/* Charts Grid */}
              {result.summary.totalAssets > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white">Assets by Category</h3>
                    <p className="text-xs text-slate-400 mb-3">Distribution of asset count across categories</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={result.charts.byCategory} margin={{ top: 8, right: 12, left: -16, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-20} textAnchor="end" interval={0} height={50} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }} />
                          <Bar dataKey="count" name="Assets" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white">Condition &amp; Status Mix</h3>
                    <p className="text-xs text-slate-400 mb-3">Share of Active, Maintenance, Damaged, Missing &amp; Obsolete</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={result.charts.byStatus}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="45%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                          >
                            {result.charts.byStatus.map((entry: any, idx: number) => (
                              <Cell
                                key={entry.name}
                                fill={STATUS_COLORS[entry.name] || CHART_COLORS[idx % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white">Top Stations by Volume</h3>
                    <p className="text-xs text-slate-400 mb-3">Stations holding the highest asset counts</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={result.charts.byStation} layout="vertical" margin={{ top: 8, right: 16, left: 10, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                          <YAxis dataKey="name" type="category" width={95} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }} />
                          <Bar dataKey="count" name="Assets" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Charts for non-inventory array reports (movement, missing, damaged, verification) */}
          {selectedReport !== 'inventory' && Array.isArray(result.data) && result.data.length > 0 && (() => {
            const counts = new Map<string, number>();
            for (const row of result.data) {
              const key = row.stationName || row.toStation || row.categoryName || row.status || 'Other';
              counts.set(key, (counts.get(key) || 0) + 1);
            }
            const chartRows = Array.from(counts.entries())
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10);

            if (chartRows.length === 0) return null;
            return (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">Report Distribution Overview</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Record volume grouped by station / category ({result.data.length} total records)
                </p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartRows} margin={{ top: 8, right: 16, left: -16, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-15} textAnchor="end" interval={0} height={46} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }} />
                      <Bar dataKey="count" name="Records" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-semibold text-white">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Report Results</span>
            </div>
            {result.summary && (
              <div className="flex items-center space-x-4 text-xs text-slate-400">
                {Object.entries(result.summary).map(([k, v]) => (
                  <span key={k}>
                    <span className="font-semibold text-slate-300">{String(v)}</span>{' '}
                    {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {(() => {
            const hasAssetId = Array.isArray(result.data) && result.data.length > 0 && ('assetId' in result.data[0]);

            return Array.isArray(result.data) && result.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {Object.keys(result.data[0]).map((col) => (
                        <th key={col} className="px-3 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {col.replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                      {hasAssetId && (
                        <th className="px-3 py-2.5 text-center font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((row: any, i: number) => (
                      <tr key={i} className="border-t border-slate-800/60">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-2.5 text-slate-300 whitespace-nowrap">
                            {String(val ?? '—')}
                          </td>
                        ))}
                        {hasAssetId && (
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => openDrawer(row.assetId)}
                              title="View Asset Details"
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">
                No data for the selected filters.
              </div>
            );
          })()}
          </div>
        </div>
      )}

      {/* Drawer Overlay */}
      {drawerAssetId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
          {/* Drawer backdrop close click */}
          <div className="flex-1" onClick={closeDrawer}></div>

          <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/20">
              <div>
                <h3 className="text-lg font-bold text-white font-mono">
                  {drawerAsset?.assetId || 'Loading...'}
                </h3>
                <p className="text-xs text-slate-400">Asset Detail & Lifecycle Portal</p>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <>
                {/* Tabs selection */}
                <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-800 px-6 bg-slate-950/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    onClick={() => setDrawerTab('info')}
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex-shrink-0 ${
                      drawerTab === 'info'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Specifications
                  </button>
                  <button
                    onClick={() => setDrawerTab('history')}
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex-shrink-0 ${
                      drawerTab === 'history'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    History Timeline
                  </button>
                </div>

                {/* Tab content area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Info Tab */}
                  {drawerTab === 'info' && drawerAsset && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Name</p>
                          <p className="text-sm font-medium text-white">{drawerAsset.name}</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Category</p>
                          <p className="text-sm font-medium text-white">{drawerAsset.categoryName}</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Brand</p>
                          <p className="text-sm font-medium text-white">{drawerAsset.brand || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Model</p>
                          <p className="text-sm font-medium text-white">{drawerAsset.model || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Serial Number</p>
                          <p className="text-sm font-mono text-white">{drawerAsset.serialNumber}</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Current Status</p>
                          <span
                            className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold border rounded-full bg-slate-800 text-slate-300 border-slate-700`}
                          >
                            {drawerAsset.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-4 space-y-4">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location & Assignment</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Region & Station</p>
                            <p className="text-sm text-slate-200">{drawerAsset.stationName}, {drawerAsset.regionName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Department</p>
                            <p className="text-sm text-slate-200">{drawerAsset.departmentName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Assigned Employee</p>
                            <p className="text-sm text-slate-200">{drawerAsset.assignedEmployeeName || 'Unassigned'}</p>
                            {drawerAsset.assignedEmployeeIdCode && (
                              <span className="text-[10px] text-slate-500 font-mono">{drawerAsset.assignedEmployeeIdCode}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-4 space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Acquisition Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Acquisition Date</p>
                            <p className="text-sm text-slate-200">{formatDate(drawerAsset.acquisitionDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Last Verified</p>
                            <p className="text-sm text-slate-200">{formatDate(drawerAsset.lastVerificationDate)}</p>
                          </div>
                        </div>
                      </div>

                      {drawerAsset.description && (
                        <div className="border-t border-slate-800 pt-4">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Description</p>
                          <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{drawerAsset.description}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* History Timeline Tab */}
                  {drawerTab === 'history' && (
                    <div className="space-y-4">
                      {drawerHistory.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">No history events logged</p>
                      ) : (
                        <div className="relative border-l border-slate-800 pl-6 space-y-6">
                          {drawerHistory.map((h: any) => (
                            <div key={h.id} className="relative">
                              <span className="absolute -left-[31px] top-1.5 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-slate-900"></span>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 block font-mono">
                                  {new Date(h.createdAt).toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-white px-2 py-0.5 bg-slate-800 rounded border border-slate-700/60 inline-block mb-1">
                                  {h.actionType}
                                </span>
                                <p className="text-sm text-slate-300">{h.description}</p>
                                <span className="text-xs text-slate-500 block">
                                  Action by: <span className="font-semibold text-slate-400">{h.userName} ({h.userUsername})</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
