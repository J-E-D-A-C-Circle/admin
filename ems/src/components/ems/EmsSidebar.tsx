'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Send,
  FileCheck2,
  FileBarChart2,
  Building2,
  ShieldCheck,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';

interface EmsSidebarProps {
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  activeView?: string;
  onSelectView?: (view: 'dashboard' | 'registry' | 'returns' | 'reports' | 'compliance' | 'audit') => void;
}

export default function EmsSidebar({
  collapsed: controlledCollapsed,
  onCollapseChange,
  mobileOpen = false,
  onCloseMobile,
  activeView = 'hub',
  onSelectView
}: EmsSidebarProps) {
  const router = useRouter();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ems_user') || localStorage.getItem('dams_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dams_token');
    localStorage.removeItem('dams_user');
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    router.push('/login');
  };

  const toggleCollapse = () => {
    const next = !collapsed;
    setInternalCollapsed(next);
    if (onCollapseChange) onCollapseChange(next);
  };

  const navItems = [
    {
      id: 'dashboard',
      name: 'EMS Dashboard',
      icon: LayoutDashboard,
      description: 'Expenditure & Core Metrics',
    },
    {
      id: 'registry',
      name: 'Dispatch Register',
      icon: Send,
      description: 'Log, Vouchers & Verify',
    },
    {
      id: 'returns',
      name: 'Monthly Returns',
      icon: FileCheck2,
      description: 'Auto-Compile & HQ Sign-off',
    },
    {
      id: 'reports',
      name: 'Reports & Export',
      icon: FileBarChart2,
      description: 'Excel & Official PDF',
    },
    {
      id: 'compliance',
      name: 'Offices & Compliance',
      icon: Building2,
      description: 'National Status Matrix',
    },
    {
      id: 'audit',
      name: 'Audit Trail',
      icon: ShieldCheck,
      description: 'Tamper-Proof System Logs',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white border-r border-zinc-200/70 text-zinc-800 flex flex-col ${
          collapsed ? 'md:w-20' : 'md:w-64'
        } w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-[0_0_15px_rgba(0,0,0,0.02)]`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-200/70 bg-white">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-zinc-50 border border-zinc-200/80 p-1 flex items-center justify-center shrink-0 shadow-2xs">
              <img src="/logo.png" alt="DVLA" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-950 tracking-tight leading-none">
                  DVLA EMS TRACKING
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold tracking-wider uppercase mt-1">
                  Expenditure Control
                </span>
              </div>
            )}
          </div>
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 ml-auto flex-shrink-0 transition-colors"
            aria-label="Collapse sidebar"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 ml-auto flex-shrink-0 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Category Label */}
        <div className="px-4 pt-4 pb-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {!collapsed && <span>SRS Tracking Modules</span>}
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onSelectView) onSelectView(item.id as any);
                  if (mobileOpen && onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70 font-medium'
                }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 ${collapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-zinc-500 group-hover:text-emerald-700'
                  }`}
                />
                {!collapsed && (
                  <div className="flex-1 overflow-hidden">
                    <span className="text-xs font-semibold block leading-tight">{item.name}</span>
                    <span
                      className={`text-[10px] block mt-0.5 truncate leading-tight ${
                        isActive ? 'text-emerald-100 font-normal' : 'text-zinc-400'
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile & footer */}
        <div className="p-3 border-t border-zinc-200/70 bg-zinc-50/50 space-y-2">
          {!collapsed && (
            <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 ring-1 ring-emerald-600/20 flex items-center justify-center text-emerald-700 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-zinc-900 truncate leading-snug">
                  {user?.name || 'EMS Officer'}
                </p>
                <p className="text-[10px] font-medium text-emerald-700 truncate leading-none mt-0.5">
                  {user?.role || 'EMS Admin Officer'}
                </p>
              </div>
            </div>
          )}

          {!collapsed && (
            <div className="flex items-center justify-between w-full rounded-xl border border-zinc-200/80 bg-white px-3 py-1.5 text-[10px] font-semibold tracking-wider text-zinc-600 shadow-2xs">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>GhanaPost Sync</span>
              </span>
              <span className="text-emerald-700 font-bold">Active</span>
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-rose-50 text-zinc-600 hover:text-rose-700 border border-zinc-200/80 hover:border-rose-200 transition-all shadow-2xs cursor-pointer ${
              collapsed ? 'justify-center' : 'justify-center space-x-2'
            }`}
            title="Sign Out of EMS"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
