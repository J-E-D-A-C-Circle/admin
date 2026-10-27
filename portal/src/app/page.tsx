'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Package, 
  Receipt, 
  Car, 
  ArrowRight, 
  XCircle, 
  Clock, 
  CheckCircle2,
  Layers,
  ShieldCheck,
  Activity,
  ExternalLink
} from 'lucide-react';

export default function CentralPortal() {
  const [status, setStatus] = useState<{ 
    ams: boolean | null; 
    ems: boolean | null; 
    fleet: boolean | null;
  }>({
    ams: null,
    ems: null,
    fleet: null,
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStatus({ ams: data.ams, ems: data.ems, fleet: data.fleet });
        setLoading(false);
        return;
      }
    } catch {
      // Browser fallback ping
    }

    const checkClient = async (url: string) => {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 2000);
        await fetch(url, { mode: 'no-cors', signal: ctrl.signal });
        clearTimeout(tid);
        return true;
      } catch {
        return false;
      }
    };

    const [amsRes, emsRes, fleetRes] = await Promise.all([
      checkClient('http://localhost:3001'),
      checkClient('http://localhost:3002'),
      checkClient('http://localhost:3003'),
    ]);

    setStatus({ ams: amsRes, ems: emsRes, fleet: fleetRes });
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const onlineCount = [status.ams, status.ems, status.fleet].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* TOP NAVIGATION BAR */}
      <nav className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="DVLA Logo" 
              width={140} 
              height={60} 
              className="h-10 sm:h-11 w-auto object-contain"
              priority
            />
            <div className="hidden sm:block h-5 w-[1px] bg-slate-200"></div>
            <span className="hidden sm:block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Administration Gateway
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
            {currentTime && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentTime}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-ring"></span>
              <span>Gateway Active ({onlineCount}/3 Online)</span>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-6 w-full flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
          <Layers className="w-3.5 h-3.5 text-blue-600" /> Enterprise Microservices Portal
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          DVLA <span className="text-emerald-600">Central Administration</span> Gateway
        </h1>

        <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
          Unified access point for Driver and Vehicle Licensing Authority enterprise administrative systems. Select a module below to launch its workspace.
        </p>
      </div>

      {/* MODULE CARDS GRID */}
      <main className="max-w-7xl mx-auto px-6 py-4 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto">
        
        {/* MODULE 1: AMS */}
        <div className="group bg-white border border-slate-200 hover:border-blue-500/80 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div>
            {/* CARD TOP HEADER */}
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
                <Package className="w-6 h-6" />
              </div>

              {/* LIVE STATUS */}
              {loading ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> Checking
                </span>
              ) : status.ams ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-ring"></span> ONLINE (3001)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
                  <XCircle className="w-3.5 h-3.5" /> OFFLINE
                </span>
              )}
            </div>

            {/* TITLE & DESCRIPTION */}
            <div className="mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                Module 01 &bull; Asset Tracking
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors">
                Asset Management System
              </h2>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed mb-5">
              Centralized DVLA inventory tracking, equipment auditing, hardware lifecycle management, and asset compliance reporting.
            </p>

            {/* FEATURE HIGHLIGHTS */}
            <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> Equipment & Hardware Inventory
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> Automated Lifecycle Audits & Reports
              </div>
            </div>
          </div>

          {/* LAUNCH BUTTON */}
          <a 
            href="http://localhost:3001" 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center justify-between w-full py-3.5 px-5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 group/btn"
          >
            <span>Launch AMS Portal</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* MODULE 2: EMS */}
        <div className="group bg-white border border-slate-200 hover:border-emerald-500/80 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div>
            {/* CARD TOP HEADER */}
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
                <Receipt className="w-6 h-6" />
              </div>

              {/* LIVE STATUS */}
              {loading ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> Checking
                </span>
              ) : status.ems ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-ring"></span> ONLINE (3002)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
                  <XCircle className="w-3.5 h-3.5" /> OFFLINE
                </span>
              )}
            </div>

            {/* TITLE & DESCRIPTION */}
            <div className="mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                Module 02 &bull; Expenditure & Postal
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2 group-hover:text-emerald-600 transition-colors">
                Expenditure Tracking System
              </h2>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed mb-5">
              Ghana Post EMS dispatch tracking, expenditure auditing, item cost logs, receipt uploads, and financial reconciliation.
            </p>

            {/* FEATURE HIGHLIGHTS */}
            <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Postal Dispatches & Receipt Archiving
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Cost Reconciliation & Daily Backups
              </div>
            </div>
          </div>

          {/* LAUNCH BUTTON */}
          <a 
            href="http://localhost:3002" 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center justify-between w-full py-3.5 px-5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all duration-200 group/btn"
          >
            <span>Launch EMS Portal</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* MODULE 3: FLEET */}
        <div className="group bg-white border border-slate-200 hover:border-indigo-500/80 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div>
            {/* CARD TOP HEADER */}
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
                <Car className="w-6 h-6" />
              </div>

              {/* LIVE STATUS */}
              {loading ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> Checking
                </span>
              ) : status.fleet ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-ring"></span> ONLINE (3003)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
                  <XCircle className="w-3.5 h-3.5" /> OFFLINE
                </span>
              )}
            </div>

            {/* TITLE & DESCRIPTION */}
            <div className="mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
                Module 03 &bull; Fleet & Telematics
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">
                Fleet Management System
              </h2>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed mb-5">
              Real-time DVLA vehicle telemetry, maintenance scheduling, driver assignments, fuel consumption logs, and trip analytics.
            </p>

            {/* FEATURE HIGHLIGHTS */}
            <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Vehicle Telemetry & Driver Assignments
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Maintenance Schedules & Fuel Tracking
              </div>
            </div>
          </div>

          {/* LAUNCH BUTTON */}
          <a 
            href="http://localhost:3003" 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center justify-between w-full py-3.5 px-5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all duration-200 group/btn"
          >
            <span>Launch Fleet Portal</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </a>
        </div>

      </main>

      {/* QUICK STATUS STRIP */}
      <div className="max-w-7xl mx-auto px-6 py-2 w-full">
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Infrastructure Health Monitor</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${status.ams ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              AMS: {status.ams ? 'Online (3001)' : 'Standby'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${status.ems ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              EMS: {status.ems ? 'Online (3002)' : 'Standby'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${status.fleet ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              Fleet: {status.fleet ? 'Online (3003)' : 'Standby'}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 mt-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            &copy; {new Date().getFullYear()} Driver and Vehicle Licensing Authority (DVLA) &bull; Central Enterprise Administration Gateway
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Enterprise Gateway Environment
          </div>
        </div>
      </footer>

    </div>
  );
}
