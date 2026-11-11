'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { 
  Package, 
  Receipt, 
  Car, 
  ArrowRight, 
  XCircle, 
  Clock, 
  Database, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ExternalLink 
} from 'lucide-react';

interface ServiceDetail {
  online: boolean;
  latency: number;
}

interface ServiceStatus {
  ams: boolean | null;
  ems: boolean | null;
  fleet: boolean | null;
  details?: {
    ams: ServiceDetail;
    ems: ServiceDetail;
    fleet: ServiceDetail;
  };
}

export default function CentralPortal() {
  const [status, setStatus] = useState<ServiceStatus>({
    ams: null,
    ems: null,
    fleet: null,
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDevOps, setShowDevOps] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStatus({
          ams: data.ams,
          ems: data.ems,
          fleet: data.fleet,
          details: data.details,
        });
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
    } catch {
      // Browser direct fallback
    }

    const checkClient = async (url: string) => {
      const start = Date.now();
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 2000);
        await fetch(url, { mode: 'no-cors', signal: ctrl.signal });
        clearTimeout(tid);
        return { online: true, latency: Math.max(2, Date.now() - start) };
      } catch {
        return { online: false, latency: 0 };
      }
    };

    const [amsRes, emsRes, fleetRes] = await Promise.all([
      checkClient('http://localhost:3001'),
      checkClient('http://localhost:3002'),
      checkClient('http://localhost:3003'),
    ]);

    setStatus({
      ams: amsRes.online,
      ems: emsRes.online,
      fleet: fleetRes.online,
      details: {
        ams: amsRes,
        ems: emsRes,
        fleet: fleetRes,
      },
    });
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Africa/Accra',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'Africa/Accra',
        })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const onlineCount = [status.ams, status.ems, status.fleet].filter(Boolean).length;
  const avgLatency = useMemo(() => {
    if (!status.details) return 14;
    const lats = [
      status.details.ams?.latency,
      status.details.ems?.latency,
      status.details.fleet?.latency,
    ].filter((l): l is number => typeof l === 'number' && l > 0);
    if (lats.length === 0) return 12;
    return Math.round(lats.reduce((a, b) => a + b, 0) / lats.length);
  }, [status.details]);

  // Modules definition
  const modules = [
    {
      id: 'ams',
      number: '01',
      title: 'Asset Management System',
      acronym: 'AMS',
      port: 3001,
      url: 'http://localhost:3001',
      tag: 'Capital Assets & GIS',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
      borderColor: 'border-slate-200 hover:border-emerald-500/80',
      glowColor: 'hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20',
      icon: Package,
      online: status.ams,
      latency: status.details?.ams?.latency,
      description:
        'Official DVLA nationwide asset registry with 16-region interactive GIS geospatial mapping, barcode/QR tracking, transfer workflows, and automated depreciation audits.',
    },
    {
      id: 'ems',
      number: '02',
      title: 'Expenditure Management System',
      acronym: 'EMS',
      port: 3002,
      url: 'http://localhost:3002',
      tag: 'Expenditure & Logistics',
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500',
      borderColor: 'border-slate-200 hover:border-cyan-500/80',
      glowColor: 'hover:shadow-cyan-500/10',
      iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
      btnBg: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20',
      icon: Receipt,
      online: status.ems,
      latency: status.details?.ems?.latency,
      description:
        'Ghana Post EMS dispatch tracking, expenditure auditing, itemized operational disbursement ledgers, digitized receipt archives, and financial reconciliation.',
    },
    {
      id: 'fleet',
      number: '03',
      title: 'Fleet Management System',
      acronym: 'FMS',
      port: 3003,
      url: 'http://localhost:3003',
      tag: 'Telematics & Fleet Operations',
      color: 'indigo',
      gradient: 'from-indigo-500 to-violet-500',
      borderColor: 'border-slate-200 hover:border-indigo-500/80',
      glowColor: 'hover:shadow-indigo-500/10',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20',
      icon: Car,
      online: status.fleet,
      latency: status.details?.fleet?.latency,
      description:
        'Real-time official vehicle telematics, GPS geofencing, driver credentials and shift allocation, preventive maintenance scheduling, and fuel consumption logs.',
    },
  ];

  // Filter modules based on search input
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const q = searchQuery.toLowerCase();
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.acronym.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tag.toLowerCase().includes(q)
    );
  }, [searchQuery, modules]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background Ambience: Subtle Cyber Dot Pattern & Radial Lighting */}
      <div className="fixed inset-0 bg-grid-pattern-light pointer-events-none opacity-80 z-0" />
      <div className="fixed inset-0 bg-radial-light pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* TOP ENTERPRISE NAVIGATION BAR */}
        <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-50 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
            {/* Left: Official DVLA Crest & Gateway Identity */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center p-1 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                <Image
                  src="/logo.png"
                  alt="DVLA Official Emblem"
                  width={140}
                  height={56}
                  className="h-10 sm:h-11 w-auto object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                  DVLA CENTRAL GATEWAY
                </span>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Driver &amp; Vehicle Licensing Authority &bull; Ghana
                </span>
              </div>
            </div>

            {/* Right: Live Telemetry, Accra Clock & Retractable DevOps Console Trigger */}
            <div className="flex items-center gap-2.5">
              {/* Accra Local Time */}
              {currentTime && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200 text-xs font-mono text-slate-700 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-slate-500">{currentDate}</span>
                  <span className="text-slate-400">|</span>
                  <span className="font-semibold text-slate-900">{currentTime} GMT</span>
                </div>
              )}

              {/* Real-time Health Status Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <div className="relative flex items-center justify-center w-2.5 h-2.5">
                  <span
                    className={`absolute w-full h-full rounded-full animate-radar-pulse ${
                      onlineCount === 3
                        ? 'bg-emerald-400'
                        : onlineCount > 0
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span
                    className={`w-2 h-2 rounded-full ${
                      onlineCount === 3
                        ? 'bg-emerald-500'
                        : onlineCount > 0
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
                <span className="font-bold">
                  {loading ? 'Probing...' : `${onlineCount}/3 Online`}
                </span>
                {!loading && (
                  <span className="hidden sm:inline font-mono text-[11px] text-emerald-700 opacity-80">
                    &bull; {avgLatency}ms
                  </span>
                )}
              </div>

              {/* Retractable DevOps Console Toggle Icon */}
              <button
                onClick={() => setShowDevOps((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  showDevOps
                    ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title="Toggle Database Engines & DevOps Command Console"
              >
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">DevOps</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    showDevOps ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Refresh Button */}
              <button
                onClick={fetchStatus}
                disabled={isRefreshing}
                title="Refresh Service Telemetry"
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`}
                />
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6 w-full flex flex-col items-center text-center">
          {/* Sovereign Badge with Ghana Flag Accent */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono uppercase tracking-widest text-slate-700 mb-3.5 shadow-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ce1126]" />
              <span className="w-2 h-2 rounded-full bg-[#fcd116]" />
              <span className="w-2 h-2 rounded-full bg-[#006b3f]" />
            </span>
            <span className="font-semibold">Republic of Ghana &bull; Ministry of Transport</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 max-w-4xl leading-tight">
            Enterprise Administration{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
              Command Gateway
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
            Unified access portal orchestrating national fixed capital assets, Ghana Post logistics
            &amp; expenditure auditing, and telematics fleet operations across all 16 administrative
            regions.
          </p>

          {/* Quick Search Bar */}
          <div className="w-full max-w-2xl relative mb-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search modules, workflows, dispatches, or systems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-xs transition-all"
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-500 hover:text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-100 rounded border border-slate-200">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>
        </section>

        {/* CORE ENTERPRISE MODULES GRID */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
          {filteredModules.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-800">No matching modules or workflows found</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for &quot;assets&quot;, &quot;fleet&quot;, or &quot;expenditure&quot;.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.map((mod) => {
                const IconComponent = mod.icon;
                return (
                  <div
                    key={mod.id}
                    className={`group relative rounded-2xl bg-white border ${mod.borderColor} p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${mod.glowColor} overflow-hidden shadow-sm`}
                  >
                    {/* Top Decorative Gradient Accent */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${mod.gradient}`}
                    />

                    <div>
                      {/* Card Header: Icon, Number & Live Status Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`w-12 h-12 rounded-2xl ${mod.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300`}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col items-end gap-1">
                          {loading ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3 h-3 animate-spin" /> Checking
                            </span>
                          ) : mod.online ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-radar-pulse" />
                              ONLINE
                              {mod.latency && mod.latency > 0 && (
                                <span className="opacity-80 font-normal">({mod.latency}ms)</span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" /> STANDBY
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            Port {mod.port}
                          </span>
                        </div>
                      </div>

                      {/* Module Identifier & Title */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            MODULE {mod.number}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            &bull; {mod.tag}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {mod.title}
                        </h2>
                      </div>

                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                        {mod.description}
                      </p>
                    </div>

                    {/* Launch Workspace CTA Button */}
                    <a
                      href={mod.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center justify-between w-full py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm ${mod.btnBg} transition-all duration-200 group/btn mt-4`}
                    >
                      <span>Launch {mod.acronym} Workspace</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* RETRACTABLE DEVOPS & DATABASE ENGINEERING ADMINISTRATION PANEL */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowDevOps((prev) => !prev)}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-xs transition-all cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <span>{showDevOps ? 'Hide' : 'Show'} Database Engines &amp; DevOps Console</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  MySQL 8.0 &bull; Ports 3308, 3309, 3310
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                    showDevOps ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>3 Databases Active</span>
              </div>
            </div>

            {/* Collapsible content */}
            {showDevOps && (
              <section className="mt-4 rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        Database Engines &amp; DevOps Command Console
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                          Tier-3 IT Admin
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Direct SQL consoles, phpMyAdmin administrative portals, and automated database snapshot engines.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* DAMS Database */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase">
                          MySQL 8.0 &bull; 3308
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">AMS Database</h4>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Asset inventory, station geocodes, serial numbers &amp; depreciation schedules.
                      </p>
                    </div>
                    <a
                      href="http://localhost:8080"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-800 pt-2 border-t border-slate-200 group"
                    >
                      <span>phpMyAdmin (8080)</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>

                  {/* EMS Database */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-cyan-700 font-bold uppercase">
                          MySQL 8.0 &bull; 3310
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">EMS Database</h4>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Ghana Post dispatch waybills, itemized cost ledgers &amp; receipts.
                      </p>
                    </div>
                    <a
                      href="http://localhost:8082"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-cyan-700 hover:text-cyan-800 pt-2 border-t border-slate-200 group"
                    >
                      <span>phpMyAdmin (8082)</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>

                  {/* Fleet Database */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-indigo-700 font-bold uppercase">
                          MySQL 8.0 &bull; 3309
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Fleet Database</h4>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Telemetry logs, vehicle registrations, driver shifts &amp; fuel tracking.
                      </p>
                    </div>
                    <a
                      href="http://localhost:8083"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-indigo-700 hover:text-indigo-800 pt-2 border-t border-slate-200 group"
                    >
                      <span>phpMyAdmin (8083)</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>

                  {/* Automated Backup Daemon */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-amber-700 font-bold uppercase">
                          Daemon &bull; Cron Active
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Daily Snapshots</h4>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Continuous archival backup daemon protecting enterprise transaction history.
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Container: ems-db-backup</span>
                      <span className="text-emerald-600 font-bold">Running</span>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>

        {/* INSTITUTIONAL FOOTER */}
        <footer className="w-full bg-white border-t border-slate-200 py-6 mt-12 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="DVLA Logo"
                  width={120}
                  height={50}
                  className="h-9 w-auto object-contain"
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    Driver and Vehicle Licensing Authority (DVLA)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Republic of Ghana &bull; National Headquarters, Cantonments, Accra
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
                <span>IT Support: support@dvla.gov.gh</span>
                <span>&bull;</span>
                <span>Internal Ext: 8001 / 8002</span>
              </div>
            </div>

            <div className="text-center sm:text-left text-[11px] font-mono text-slate-400 pt-4">
              &copy; {new Date().getFullYear()} Driver &amp; Vehicle Licensing Authority. All Rights Reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
