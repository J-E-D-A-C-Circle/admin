'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { 
  Package, 
  Receipt, 
  Car, 
  ArrowRight, 
  Clock, 
  Search, 
  RefreshCw
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
  const [host, setHost] = useState('localhost');
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

    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
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
      checkClient(`http://${currentHost}:3001`),
      checkClient(`http://${currentHost}:3002`),
      checkClient(`http://${currentHost}:3003`),
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
    if (typeof window !== 'undefined' && window.location.hostname) {
      setHost(window.location.hostname);
    }
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

  // Modules definition
  const modules = [
    {
      id: 'ams',
      number: '01',
      title: 'Asset Management System',
      acronym: 'AMS',
      url: `http://${host}:3001`,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
      borderColor: 'border-slate-200 hover:border-emerald-500/80',
      glowColor: 'hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20',
      icon: Package,
    },
    {
      id: 'ems',
      number: '02',
      title: 'Ghana Post Tracking',
      acronym: 'EMS',
      url: `http://${host}:3002`,
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500',
      borderColor: 'border-slate-200 hover:border-cyan-500/80',
      glowColor: 'hover:shadow-cyan-500/10',
      iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
      btnBg: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20',
      icon: Receipt,
    },
    {
      id: 'fleet',
      number: '03',
      title: 'Fleet Management System',
      acronym: 'FMS',
      url: `http://${host}:3003`,
      color: 'indigo',
      gradient: 'from-indigo-500 to-violet-500',
      borderColor: 'border-slate-200 hover:border-indigo-500/80',
      glowColor: 'hover:shadow-indigo-500/10',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20',
      icon: Car,
    },
  ];

  // Filter modules based on search input
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const q = searchQuery.toLowerCase();
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.acronym.toLowerCase().includes(q)
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
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-black">
                  Dvla Administration portal
                </span>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Driver &amp; Vehicle Licensing Authority &bull; Ghana
                </span>
              </div>
            </div>

            {/* Right: Accra Clock & Refresh */}
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-black mb-3 max-w-4xl leading-tight">
            DVLA Administration Portal
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
            Access and manage DVLA assets, Ghana Post tracking, and fleet operations in one place.
          </p>

          {/* Quick Search Bar */}
          <div className="w-full max-w-2xl relative mb-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-16 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-xs transition-all"
              />
              {searchQuery && (
                <div className="absolute right-3 flex items-center">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-500 hover:text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
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
                  <a
                    key={mod.id}
                    href={mod.url}
                    className={`group relative rounded-2xl bg-white border ${mod.borderColor} p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${mod.glowColor} overflow-hidden shadow-sm cursor-pointer`}
                  >
                    {/* Top Decorative Gradient Accent */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${mod.gradient}`}
                    />

                    <div className="flex items-center gap-3.5 mb-2">
                      <div
                        className={`w-12 h-12 shrink-0 rounded-2xl ${mod.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300`}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {mod.title}
                      </h2>
                    </div>

                    {/* Launch Workspace CTA Button */}
                    <div
                      className={`inline-flex items-center justify-between w-full py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm ${mod.btnBg} transition-all duration-200 group/btn mt-4`}
                    >
                      <span>Visit {mod.acronym}</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
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
