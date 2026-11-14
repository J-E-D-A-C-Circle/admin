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
  Loader2,
  Bell,
  Wrench,
  ShieldCheck,
  ClipboardCheck,
  QrCode,
  ArrowRightLeft,
  FileSpreadsheet,
  X,
  FileText,
  PlusCircle,
  Clock
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
  Sector
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom states for interactive charts
  const [ageCategory, setAgeCategory] = useState('all');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('overview');

  // Overdue Verifications states
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [overdueAssets, setOverdueAssets] = useState<any[]>([]);
  const [overdueLoading, setOverdueLoading] = useState(false);

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const loadData = async () => {
    try {
      const [dash, notifs] = await Promise.all([
        api.getDashboard(),
        api.getNotifications()
      ]);
      setData(dash);
      setNotifications(notifs.slice(0, 5));
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
      subtitle: 'Recorded inventory',
      icon: Package,
      badge: 'All Assets',
      variant: 'default' as const,
      iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Active Assets',
      value: kpis.active,
      subtitle: `${kpis.total ? ((kpis.active / kpis.total) * 100).toFixed(0) : 0}% operational`,
      icon: CheckCircle,
      badge: 'In Service',
      variant: 'success' as const,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Under Maintenance',
      value: kpis.underMaintenance,
      subtitle: 'Repairs & inspection',
      icon: Wrench,
      badge: 'Servicing',
      variant: 'info' as const,
      iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Auctioned Assets',
      value: kpis.auctioned ?? 0,
      subtitle: 'Disposed via auction',
      icon: AlertTriangle,
      badge: 'Auctioned',
      variant: 'warning' as const,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Damaged Assets',
      value: kpis.damaged,
      subtitle: 'Decommission candidates',
      icon: FileMinus,
      badge: 'Critical',
      variant: 'destructive' as const,
      iconColor: 'text-red-400 bg-red-500/10 border-red-500/20'
    },
    {
      title: 'Audit Reminders',
      value: kpis.overdueVerifications,
      subtitle: 'Pending >90 days',
      icon: ClipboardCheck,
      badge: kpis.overdueVerifications > 0 ? 'Overdue' : 'Compliant',
      variant: kpis.overdueVerifications > 0 ? ('destructive' as const) : ('secondary' as const),
      iconColor: kpis.overdueVerifications > 0 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-slate-400 bg-slate-800 border-slate-700',
      onClick: kpis.overdueVerifications > 0 ? openOverdueModal : undefined
    }
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
      const pData = payload[0].payload;
      const index = charts.assetsByCategory?.findIndex((c: any) => c.name === pData.name) ?? -1;
      const color = payload[0].color || (index >= 0 ? COLORS[index % COLORS.length] : '#f59e0b');
      const pct = totalCategoryAssets > 0 ? ((pData.value / totalCategoryAssets) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[140px] pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="font-bold text-white">{pData.name}</span>
          </div>
          <div className="border-t border-slate-800/80 my-1.5" />
          <div className="flex items-center justify-between space-x-6 text-[11px]">
            <span className="text-slate-400">Total Count:</span>
            <span className="font-mono font-bold text-slate-200">{pData.value}</span>
          </div>
          <div className="flex items-center justify-between space-x-6 text-[11px]">
            <span className="text-slate-400">Share:</span>
            <span className="font-mono font-bold text-emerald-400">{pct}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Executive Dashboard
            </h1>
            <Badge variant="gold" className="text-xs font-semibold px-2.5 py-0.5">
              Live Assets
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            National DVLA Asset Distribution & Audit Health Metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/assets/register">
            <Button variant="gold" size="sm" className="shadow-md shadow-amber-500/10">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Register Asset</span>
            </Button>
          </Link>
          <Link href="/verifications">
            <Button variant="outline" size="sm">
              <QrCode className="w-4 h-4 mr-1.5 text-amber-500" />
              <span>Audit Scanner</span>
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="secondary" size="sm">
              <FileText className="w-4 h-4 mr-1.5 text-slate-300" />
              <span>Export Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview KPIs</TabsTrigger>
          <TabsTrigger value="regional">Regional Map & Categories</TabsTrigger>
          <TabsTrigger value="age">Age & Depreciation</TabsTrigger>
          <TabsTrigger value="activity">Leaderboard & Alerts</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview KPIs */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Main 6 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {kpiCards.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <Card
                  key={idx}
                  onClick={kpi.onClick}
                  className={`p-4 flex flex-col justify-between ${
                    kpi.onClick ? 'cursor-pointer hover:border-amber-500/50 hover:bg-slate-800/80' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg border ${kpi.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant={kpi.variant} className="text-[10px] px-1.5 py-0">
                      {kpi.badge}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-400">{kpi.title}</p>
                    <h3 className="text-2xl font-bold text-white font-mono mt-0.5">
                      {kpi.value?.toLocaleString() ?? '—'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">{kpi.subtitle}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Link href="/verifications">
              <Card className="p-4 hover:border-slate-700 hover:bg-slate-800/50 transition-all flex items-center space-x-3.5 group">
                <div className="p-2.5 bg-slate-950 border border-slate-800 text-indigo-400 rounded-lg group-hover:scale-105 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Scan & Verify</h3>
                  <p className="text-xs text-slate-400">Rapid audit physical asset barcode scanner</p>
                </div>
              </Card>
            </Link>
            <Link href="/transfers">
              <Card className="p-4 hover:border-slate-700 hover:bg-slate-800/50 transition-all flex items-center space-x-3.5 group">
                <div className="p-2.5 bg-slate-950 border border-slate-800 text-amber-500 rounded-lg group-hover:scale-105 transition-transform">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Asset Transfers</h3>
                  <p className="text-xs text-slate-400">Inter-station transfers and custodian handovers</p>
                </div>
              </Card>
            </Link>
            <Link href="/assets">
              <Card className="p-4 hover:border-slate-700 hover:bg-slate-800/50 transition-all flex items-center space-x-3.5 group">
                <div className="p-2.5 bg-slate-950 border border-slate-800 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Registry & Bulk Actions</h3>
                  <p className="text-xs text-slate-400">Browse inventory, batch edit, and export</p>
                </div>
              </Card>
            </Link>
          </div>
        </TabsContent>

        {/* Tab 2: Regional Map & Categories */}
        <TabsContent value="regional" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets by Region */}
            <Card className="p-5">
              <CardHeader className="p-0 pb-3 border-none">
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>Asset distribution across DVLA Regional Operational Directorates</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-3">
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
              </CardContent>
            </Card>

            {/* Assets by Category */}
            <Card className="p-5">
              <CardHeader className="p-0 pb-3 border-none">
                <CardTitle>Assets by Category</CardTitle>
                <CardDescription>Inventory breakdown by equipment classification</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
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
                  <div className="sm:col-span-6 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {charts.assetsByCategory?.map((entry: any, index: number) => {
                      const color = COLORS[index % COLORS.length];
                      const pct = totalCategoryAssets > 0 ? ((entry.value / totalCategoryAssets) * 100).toFixed(1) : '0.0';
                      const isActive = activeCategoryIndex === index;
                      return (
                        <div
                          key={entry.name}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-slate-800 border-slate-700 shadow-md'
                              : 'bg-slate-950/20 border-transparent hover:bg-slate-800/40'
                          }`}
                          onMouseEnter={() => setActiveCategoryIndex(index)}
                          onMouseLeave={() => setActiveCategoryIndex(-1)}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-xs font-medium text-slate-200 truncate">{entry.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-right shrink-0">
                            <span className="text-xs font-bold text-slate-100 font-mono">{entry.value}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Age & Depreciation */}
        <TabsContent value="age" className="space-y-6 mt-0">
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <CardTitle>Asset Age Distribution & Depreciation</CardTitle>
                <CardDescription>Present active assets grouped into replacement age buckets</CardDescription>
              </div>
              <div className="w-full sm:w-52 shrink-0">
                <Select value={ageCategory} onValueChange={setAgeCategory}>
                  <SelectTrigger className="w-full h-9 bg-slate-950 border-slate-800">
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

            <CardContent className="p-0 pt-4">
              {(() => {
                const ageChartData = charts.assetsByAge?.map((bucket: any) => {
                  let total = 0;
                  charts.categoriesList?.forEach((cat: string) => {
                    total += bucket[cat] || 0;
                  });
                  return { ...bucket, total };
                }) || [];

                const getAgeBarColor = () => {
                  if (ageCategory === 'all') return '#f59e0b';
                  const index = charts.categoriesList?.indexOf(ageCategory) ?? -1;
                  return index >= 0 ? COLORS[index % COLORS.length] : '#f59e0b';
                };

                return (
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
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Activity & Alerts */}
        <TabsContent value="activity" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Alerts */}
            <Card className="p-5">
              <CardHeader className="p-0 pb-3 border-none">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <CardTitle>System Notifications</CardTitle>
                </div>
                <CardDescription>Recent automated audit alerts and transfer requests</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-2 space-y-2.5">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No recent alerts logged.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border text-xs ${
                        notif.isRead
                          ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                          : 'bg-slate-950/80 border-slate-800 text-slate-200 font-medium'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <p className="break-words leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Activity Leaderboard */}
            <Card className="p-5">
              <CardHeader className="p-0 pb-3 border-none">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <CardTitle>Top Activity Officers</CardTitle>
                </div>
                <CardDescription>Most active staff members logging verifications and audits</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                {leaderboardLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No activity recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                          <th className="py-2 px-1 text-center w-8">Rank</th>
                          <th className="py-2 px-2">Officer</th>
                          <th className="py-2 px-2">Role</th>
                          <th className="py-2 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {leaderboard.map((user, index) => (
                          <tr key={user.userId} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-2.5 px-1 text-center font-bold text-slate-500">#{index + 1}</td>
                            <td className="py-2.5 px-2">
                              <div className="font-semibold text-slate-100">{user.name}</div>
                              <div className="text-[10px] text-slate-500">{user.stationName || 'National Head Office'}</div>
                            </td>
                            <td className="py-2.5 px-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {user.role}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-400">
                              {user.actionCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Overdue Verifications Modal */}
      {showOverdueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/20">
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-base font-bold text-white">Overdue Verification Audits</h2>
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
                The following assets have not been verified in the past 90 days. Click close and navigate to Asset Registry to log an audit verification.
              </p>
              {overdueLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : overdueAssets.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No overdue verifications found.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
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
                    <tbody className="divide-y divide-slate-800 text-slate-300">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOverdueModal(false)}
              >
                Close Window
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
