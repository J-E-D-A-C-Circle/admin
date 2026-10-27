'use client';

import React from 'react';
import { MailCheck, PlusCircle, Menu, Calendar, AlertTriangle, Send, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

interface EmsHeaderProps {
  onToggleSidebar: () => void;
  activeView?: string;
  pendingCount?: number;
  totalLettersMonth?: number;
  totalCostMonth?: number;
  onOpenNewDispatch?: () => void;
}

export default function EmsHeader({
  onToggleSidebar,
  activeView = 'dashboard',
  pendingCount = 0,
  totalLettersMonth = 0,
  totalCostMonth = 0,
  onOpenNewDispatch,
}: EmsHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  const getPageInfo = () => {
    switch (activeView) {
      case 'dashboard':
        return {
          title: 'EMS Dashboard Monitor',
          subtitle: 'System Dashboard & Real-Time Expenditure Sync',
        };
      case 'registry':
        return {
          title: 'Dispatch Register & Imprest',
          subtitle: 'Search, Filter, Log and Audit Postal Dispatches',
        };
      case 'returns':
        return {
          title: 'Monthly Returns & Approvals',
          subtitle: 'Auto-Compiled Imprest Reconciliations & HQ Sign-Off',
        };
      case 'reports':
        return {
          title: 'Expenditure & Audit Reports',
          subtitle: 'GhanaPost Reconciliation, PFMA Statements & Excel Export',
        };
      case 'compliance':
        return {
          title: 'Offices & Compliance Matrix',
          subtitle: '16 Administrative Regions Submission Tracking',
        };
      case 'audit':
        return {
          title: 'System Activity Logs',
          subtitle: 'Tamper-Proof Cryptographic Activity Ledger',
        };
      default:
        return {
          title: 'EMS Monitor',
          subtitle: 'DVLA Accra Central System',
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-8 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shrink-0 print:hidden shadow-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
            <MailCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg text-white tracking-tight leading-none">
                {title}
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-amber-400 border border-amber-500/20">
                Official SRS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Live Operational Tickers & Action Buttons */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>

        {/* Operational Date Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          <span>October 27, 2026 (Operational Date)</span>
        </div>

        {/* Pending Verification Pill */}
        {pendingCount > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold pulse-active">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{pendingCount} Pending Verification</span>
          </div>
        )}

        {/* Current Month Output Ticker */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>{totalLettersMonth} Dispatches This Month</span>
        </div>

        {/* Action Button: Log Dispatch */}
        {onOpenNewDispatch && (
          <button
            type="button"
            onClick={onOpenNewDispatch}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>New Postal Dispatch</span>
          </button>
        )}
      </div>
    </header>
  );
}
