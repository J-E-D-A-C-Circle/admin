'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  FileMinus,
  TrendingUp,
  MapPin,
  ListFilter,
  Loader2,
  Bell,
  Car,
  Wrench,
  ShieldCheck,
  ClipboardCheck,
  QrCode,
  ArrowRightLeft,
  FileSpreadsheet,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom states for interactive charts
  const [ageCategory, setAgeCategory] = useState('all');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);

  // Feature 6: Overdue Verifications states
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [overdueAssets, setOverdueAssets] = useState<any[]>([]);
  const [overdueLoading, setOverdueLoading] = useState(false);

  // Feature 8: Leaderboard states
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const loadData = async () => {
    try {
      const [dash, notifs] = await Promise.all([
        api.getDashboard(),
        api.getNotifications()
      ]);
      setData(dash);
      setNotifications(notifs.slice(0, 5)); // show top 5
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const lb = await api.getActivityLeaderboard();
      setLeaderboard(lb);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadLeaderboard();
  }, []);

  const openOverdueModal = async () => {
    setShowOverdueModal(true);
    setOverdueLoading(true);
    try {
      const list = await api.getDueVerifications();
      setOverdueAssets(list);
    } catch (err) {
      console.error('Error fetching overdue verifications:', err);
    } finally {
      setOverdueLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  const kpiCards = [
    {
      title: 'Total Assets',
      value: kpis.total,
      icon: Package,
      color: 'border-slate-800 text-white bg-slate-900/40',
      iconColor: 'text-slate-400'
    },
    {
      title: 'Active Assets',
      value: kpis.active,
      icon: CheckCircle,
      color: 'border-emerald-900/50 text-emerald-100 bg-emerald-950/20',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Under Maintenance',
      value: kpis.underMaintenance,
      icon: Wrench,
      color: 'border-blue-900/50 text-blue-100 bg-blue-950/20',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Missing Assets',
      value: kpis.missing,
      icon: AlertTriangle,
      color: 'border-amber-900/50 text-amber-100 bg-amber-950/20',
      iconColor: 'text-amber-400'
    },
    {
      title: 'Damaged Assets',
      value: kpis.damaged,
      icon: FileMinus,
      color: 'border-red-900/50 text-red-100 bg-red-950/20',
      iconColor: 'text-red-400'
    },
    {
      title: 'Verification Reminders',
      value: kpis.overdueVerifications,
      icon: ClipboardCheck,
      color: kpis.overdueVerifications > 0
        ? 'border-rose-900/50 text-rose-100 bg-rose-950/20 hover:scale-[1.02] cursor-pointer transition-all duration-200'
        : 'border-slate-800 text-slate-300 bg-slate-900/40',
      iconColor: kpis.overdueVerifications > 0 ? 'text-rose-400' : 'text-slate-400',
      onClick: kpis.overdueVerifications > 0 ? openOverdueModal : undefined
    }
  ];

  const fleetKpiCards = [
    {
      title: 'Total Fleet',
      value: kpis.totalVehicles,
      icon: Car,
      color: 'border-teal-900/50 text-teal-100 bg-teal-950/20',
      iconColor: 'text-teal-400'
    },
    {
      title: 'Active Fleet',
      value: kpis.vehiclesActive,
      icon: ShieldCheck,
      color: 'border-emerald-900/50 text-emerald-100 bg-emerald-950/20',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Fleet in Maintenance',
      value: kpis.vehiclesMaintenance,
      icon: Wrench,
      color: 'border-orange-900/50 text-orange-100 bg-orange-950/20',
      iconColor: 'text-orange-400'
    },
  ];

  const COLORS = [
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#a855f7', // Purple
    '#e11d48'  // Rose
  ];

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 4}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const totalCategoryAssets = charts.assetsByCategory?.reduce((acc: number, item: any) => acc + item.value, 0) || 0;

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const index = charts.assetsByCategory?.findIndex((c: any) => c.name === data.name) ?? -1;
      const color = payload[0].color || (index >= 0 ? COLORS[index % COLORS.length] : '#f59e0b');
      const pct = totalCategoryAssets > 0 ? ((data.value / totalCategoryAssets) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[140px] pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="font-bold text-white">{data.name}</span>
          </div>
          <div className="border-t border-slate-800/80 my-1.5" />
          <div className="flex items-center justify-between space-x-6 text-[11px]">
            <span className="text-slate-400">Total Count:</span>
            <span className="font-mono font-bold text-slate-200">{data.value}</span>
          </div>
          <div className="flex items-center justify-between space-x-6 text-[11px]">
            <span className="text-slate-400">Share:</span>
            <span className="font-mono font-bold text-emerald-450">{pct}%</span>
          </div>
        </div>
      );
    }
    return null;
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">National DVLA Asset Distribution & Audit Health Metrics</p>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/verifications" className="group p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-800/50 flex items-center space-x-4 transition-all">
          <div className="p-3 bg-slate-950 border border-slate-800 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-200 font-medium text-sm">Scan & Verify</h3>
            <p className="text-xs text-slate-400 mt-0.5">Audit asset conditions rapidly</p>
          </div>
        </Link>
        <Link href="/transfers" className="group p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-800/50 flex items-center space-x-4 transition-all">
          <div className="p-3 bg-slate-950 border border-slate-800 text-amber-500 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-200 font-medium text-sm">Asset Transfers</h3>
            <p className="text-xs text-slate-400 mt-0.5">Initiate or approve moves</p>
          </div>
        </Link>
        <Link href="/assets" className="group p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-800/50 flex items-center space-x-4 transition-all">
          <div className="p-3 bg-slate-950 border border-slate-800 text-emerald-500 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-200 font-medium text-sm">Batch Edit & Export</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage the full registry</p>
          </div>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.onClick}
              className={`p-5 border rounded-xl flex items-center justify-between shadow-sm select-none ${kpi.color}`}
            >
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.title}</p>
                <h3 className="text-2xl font-black">{kpi.value ?? '—'}</h3>
              </div>
              <div className={`p-2.5 rounded-lg bg-slate-950/40 ${kpi.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Fleet Analytics Row */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Car className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Fleet Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fleetKpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className={`p-5 border rounded-xl flex items-center justify-between shadow-sm ${kpi.color}`}
              >
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{kpi.title}</p>
                  <h3 className="text-3xl font-bold">{kpi.value ?? '—'}</h3>
                </div>
                <div className={`p-3 rounded-lg bg-slate-950/40 ${kpi.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Region */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white">Assets by Region</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.assetsByRegion}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Age & Category Stacked Bar Chart */}
        {(() => {
          const ageChartData = charts.assetsByAge?.map((bucket: any) => {
            let total = 0;
            charts.categoriesList?.forEach((cat: string) => {
              total += bucket[cat] || 0;
            });
            return {
              ...bucket,
              total,
            };
          }) || [];

          const getAgeBarColor = () => {
            if (ageCategory === 'all') return '#f59e0b';
            const index = charts.categoriesList?.indexOf(ageCategory) ?? -1;
            return index >= 0 ? COLORS[index % COLORS.length] : '#f59e0b';
          };

          return (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Asset Age Distribution</h3>
                  <p className="text-xs text-slate-400 font-medium">Total present assets grouped into depreciation age buckets</p>
                </div>
                <div className="w-full sm:w-48 flex-shrink-0">
                  <Select value={ageCategory} onValueChange={setAgeCategory}>
                    <SelectTrigger className="w-full h-9 bg-slate-950 border-slate-850">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {charts.categoriesList?.map((cat: string) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageChartData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar
                      dataKey={ageCategory === 'all' ? 'total' : ageCategory}
                      fill={getAgeBarColor()}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Assets by Category */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">Assets by Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Donut Chart */}
            <div className="sm:col-span-6 relative h-64 flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                <span className="text-3xl font-black text-white font-mono leading-none">{totalCategoryAssets}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">Total Assets</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeCategoryIndex}
                    activeShape={renderActiveShape}
                    data={charts.assetsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                    onMouseLeave={() => setActiveCategoryIndex(-1)}
                  >
                    {charts.assetsByCategory?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 50 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="sm:col-span-6 space-y-2.5 max-h-64 overflow-y-auto pr-1.5 scrollbar-thin">
              {charts.assetsByCategory?.map((entry: any, index: number) => {
                const color = COLORS[index % COLORS.length];
                const pct = totalCategoryAssets > 0 ? ((entry.value / totalCategoryAssets) * 100).toFixed(1) : '0.0';
                const isActive = activeCategoryIndex === index;
                return (
                  <div
                    key={entry.name}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 border-slate-700 scale-[1.02] shadow-md'
                        : 'bg-slate-950/20 border-transparent hover:bg-slate-800/40'
                    }`}
                    onMouseEnter={() => setActiveCategoryIndex(index)}
                    onMouseLeave={() => setActiveCategoryIndex(-1)}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs font-semibold text-slate-200 truncate">{entry.name}</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-right flex-shrink-0">
                      <span className="text-xs font-bold text-slate-100 font-mono">{entry.value}</span>
                      <span className="text-[10px] text-slate-500 font-semibold font-mono">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assets by Status */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">Asset Status Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.assetsByStatus}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Notifications & Top Contributors Leaderboard Split Panel */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* System Alerts */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>System Alerts</span>
              </h3>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No recent alerts</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border text-xs ${
                        notif.isRead
                          ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                          : 'bg-slate-950/80 border-slate-800 text-slate-200 font-medium'
                      }`}
                    >
                      <div className="mt-0.5 text-amber-500">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="break-words">{notif.message}</p>
                        <span className="text-[9px] text-slate-500 block mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Contributors Leaderboard */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Top Contributors</span>
              </h3>
              {leaderboardLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No activity logged yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-2 px-1 text-center w-8">Rank</th>
                        <th className="py-2 px-2">User</th>
                        <th className="py-2 px-2">Role</th>
                        <th className="py-2 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {leaderboard.map((user, index) => (
                        <tr key={user.userId} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-2.5 px-1 text-center font-bold text-slate-500">#{index + 1}</td>
                          <td className="py-2.5 px-2">
                            <div className="font-semibold text-slate-100">{user.name}</div>
                            <div className="text-[10px] text-slate-500">{user.stationName || 'National Head Office'}</div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-400">{user.role}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-450">{user.actionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Verifications Modal */}
      {showOverdueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/20">
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-lg font-bold text-white">Overdue Verification Audits</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowOverdueModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-xs text-slate-400 mb-4">
                The following assets have not been verified in the past 90 days. Click the close button and navigate to Asset Registry to log an audit verification.
              </p>
              {overdueLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : overdueAssets.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No overdue verifications found.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-850 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase">
                        <th className="py-3 px-4">Asset ID</th>
                        <th className="py-3 px-4">Asset Name</th>
                        <th className="py-3 px-4">Station</th>
                        <th className="py-3 px-4">Last Verified</th>
                        <th className="py-3 px-4 text-right">Days Overdue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-350">
                      {overdueAssets.map((asset) => (
                        <tr key={asset.assetId} className="hover:bg-slate-800/10">
                          <td className="py-3 px-4 font-mono font-bold text-rose-400">{asset.assetId}</td>
                          <td className="py-3 px-4 font-semibold text-slate-200">{asset.name}</td>
                          <td className="py-3 px-4">{asset.stationName}</td>
                          <td className="py-3 px-4">{formatDate(asset.lastVerificationDate)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-500">+{asset.daysOverdue} d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex justify-end">
              <button
                type="button"
                onClick={() => setShowOverdueModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

