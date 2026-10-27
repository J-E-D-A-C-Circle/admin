'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumbs';
import { Search, Bell, Sun, Moon, Shield } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { api } from '@/lib/api';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  assets: 'Asset Registry',
  register: 'Register Asset',
  transfers: 'Asset Transfers',
  import: 'CSV Import',
  'audit-logs': 'Audit Logs',
  verifications: 'Audits & Verifications',
  reports: 'Reports',
  map: 'Regional Map',
  settings: 'System Settings',
  lookups: 'Classification Data',
};

export function AppHeader({
  onOpenCommandPalette,
}: {
  onOpenCommandPalette: () => void;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<{ name?: string; role?: string; username?: string } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('dams_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (e) {}
    }

    const loadNotifications = async () => {
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs || []);
      } catch (err) {}
    };
    loadNotifications();
  }, []);

  const segments = pathname.split('/').filter(Boolean);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center space-x-2">
                <img src="/logo.png" alt="DVLA Logo" className="w-5 h-5 object-contain shrink-0" />
                <span className="font-bold tracking-tight">AMS</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {segments.map((seg, idx) => {
              const href = '/' + segments.slice(0, idx + 1).join('/');
              const isLast = idx === segments.length - 1;
              const label = ROUTE_LABELS[seg] || seg;

              return (
                <React.Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {/* Command search trigger button */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick search...</span>
          <kbd className="ml-2 font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
            Ctrl+K
          </kbd>
        </button>

        {/* Notifications Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-900"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50 text-xs">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <span className="font-semibold text-white">System Notifications</span>
                <span className="text-[10px] text-amber-400 font-mono">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No recent notifications.</div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-800/40 transition-colors">
                      <p className="font-medium text-slate-200">{n.title || n.message}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Pill */}
        {user && (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs uppercase">
              {user.name ? user.name[0] : 'U'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {user.name || user.username}
              </span>
              <span className="text-[10px] text-amber-400/90 font-medium">
                {user.role || 'Asset Officer'}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
