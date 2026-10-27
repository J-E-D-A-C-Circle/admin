'use client';

import React from 'react';
import { MailCheck, PlusCircle, Menu, Clock, Send } from 'lucide-react';

interface EmsHeaderProps {
  onToggleSidebar: () => void;
  pendingCount?: number;
  totalLettersMonth?: number;
  totalCostMonth?: number;
  onOpenNewDispatch?: () => void;
}

export default function EmsHeader({
  onToggleSidebar,
  pendingCount = 0,
  totalLettersMonth = 0,
  totalCostMonth = 0,
  onOpenNewDispatch,
}: EmsHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 bg-white border-b border-zinc-200/70 shrink-0 print:hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-600/20 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
            <MailCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-zinc-900 tracking-tight leading-none">
                DVLA EMS Tracking &amp; Expenditure Control
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                Official SRS
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium mt-1">
              Centralized GhanaPost Postal Dispatch Monitoring &amp; Imprest Control
            </p>
          </div>
        </div>
      </div>

      {/* Live Operational Tickers & Action Button */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto">
        {/* Pending Verification Pill */}
        {pendingCount > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 ring-1 ring-amber-500/25 text-amber-900 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingCount} Pending Verification</span>
          </div>
        )}

        {/* Current Month Output Ticker */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 ring-1 ring-emerald-500/20 text-emerald-900 text-xs font-medium">
          <Send className="w-3.5 h-3.5 text-emerald-600" />
          <span>{totalLettersMonth} Dispatches This Month</span>
        </div>

        {/* Action Button: Log Dispatch */}
        {onOpenNewDispatch && (
          <button
            type="button"
            onClick={onOpenNewDispatch}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>New Postal Dispatch</span>
          </button>
        )}
      </div>
    </header>
  );
}
