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
  Sun,
  Moon,
  Activity
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

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
  activeView = 'dashboard',
  onSelectView
}: EmsSidebarProps) {
  const router = useRouter();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const [user, setUser] = useState<any>(null);
  const { theme, toggleTheme } = useTheme();

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
      description: 'PFMA Statements & Excel',
    },
    {
      id: 'compliance',
      name: 'Offices & Compliance',
      icon: Building2,
      description: '16 Regions Matrix',
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
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col ${
          collapsed ? 'md:w-20' : 'md:w-64'
        } w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.25)] border border-amber-500/40">
              <img src="/logo.png" alt="DVLA" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-extrabold tracking-tight text-white leading-none">
                  DVLA EMS
                </span>
                <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase mt-1">
                  Postal &amp; Expenditure
                </span>
              </div>
            )}
          </div>
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white ml-auto flex-shrink-0 transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white ml-auto flex-shrink-0 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Category Label */}
        {!collapsed && (
          <div className="px-4 pt-4 pb-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Administrative Modules
            </div>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
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
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-emerald-500/10 text-amber-300 border-l-4 border-amber-500 font-semibold shadow-md shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
                  }`}
                />
                {!collapsed && (
                  <div className="flex-1 overflow-hidden">
                    <span className="text-xs font-semibold block leading-tight">{item.name}</span>
                    <span
                      className={`text-[10px] block mt-0.5 truncate leading-tight ${
                        isActive ? 'text-amber-300/80 font-normal' : 'text-slate-500'
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
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2.5">
          {!collapsed && (
            <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-slate-100 truncate leading-snug">
                  {user?.name || 'EMS Officer'}
                </p>
                <p className="text-[10px] font-medium text-amber-400/90 truncate leading-none mt-0.5">
                  {user?.role || 'Admin Officer'}
                </p>
              </div>
            </div>
          )}

          {!collapsed && (
            <div className="flex items-center justify-between w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-active" />
                <span>GhanaPost Sync</span>
              </span>
              <span className="text-emerald-400 font-bold">Connected</span>
            </div>
          )}

          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            type="button"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`flex items-center w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white transition-all cursor-pointer ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-400" />
              )}
              {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            </div>
          </button>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            type="button"
            className={`flex items-center w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900/60 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer ${
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
