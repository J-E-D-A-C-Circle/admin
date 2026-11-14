'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ArrowRightLeft,
  FileSpreadsheet,
  ClipboardCheck,
  FileText,
  MapPin,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Search,
  History
} from 'lucide-react';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenCommandPalette?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'DASHBOARDS',
    items: [
      { name: 'Analytics Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Geographic Map', href: '/map', icon: MapPin },
    ],
  },
  {
    group: 'ASSET OPERATIONS',
    items: [
      { name: 'Asset Registry', href: '/assets', icon: Package },
      { name: 'Register Asset', href: '/assets/register', icon: PlusCircle, roles: ['Super Admin', 'Asset Officer'] },
      { name: 'Asset Transfers', href: '/transfers', icon: ArrowRightLeft },
      { name: 'Batch CSV Import', href: '/import', icon: FileSpreadsheet, roles: ['Super Admin', 'Asset Officer'] },
    ],
  },
  {
    group: 'AUDIT & VERIFICATION',
    items: [
      { name: 'Audit Trail Logs', href: '/audit-logs', icon: History, roles: ['Super Admin', 'Auditor'] },
      { name: 'Verifications', href: '/verifications', icon: ClipboardCheck },
      { name: 'Executive Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { name: 'Authority Settings', href: '/settings', icon: Settings, roles: ['Super Admin'] },
      { name: 'Lookups & Taxonomy', href: '/settings/lookups', icon: Layers, roles: ['Super Admin'] },
    ],
  },
];

export default function Sidebar({
  onCollapseChange,
  mobileOpen = false,
  onCloseMobile,
  onOpenCommandPalette,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const u = localStorage.getItem('dams_user');
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setUserRole(parsed.role || '');
        setUserName(parsed.name || parsed.username || '');
      } catch (e) {}
    }
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapseChange?.(next);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout cleanup
    }
    localStorage.removeItem('dams_token');
    localStorage.removeItem('dams_user');
    router.push('/login');
  };

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    if (href === '/assets') {
      // Highlight Asset Registry for /assets or asset detail views, but NOT sibling nav items like /assets/register or /assets/print-labels
      return (
        pathname === '/assets' ||
        (pathname.startsWith('/assets/') &&
          !pathname.startsWith('/assets/register') &&
          !pathname.startsWith('/assets/print-labels'))
      );
    }
    if (href === '/settings') {
      // Highlight Authority Settings for /settings, but NOT child nav items like /settings/lookups
      return (
        pathname === '/settings' ||
        (pathname.startsWith('/settings/') && !pathname.startsWith('/settings/lookups'))
      );
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Inset Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/30">
          <Link href="/dashboard" className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 p-1 flex items-center justify-center shadow-md shadow-amber-500/10 shrink-0">
              <img src="/logo.png" alt="DVLA Logo" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-tight">
                  DVLA ASSETS
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
                  Enterprise Suite
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Search Button in Sidebar */}
        {!collapsed && onOpenCommandPalette && (
          <div className="px-3 pt-3">
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Search AMS...</span>
              </div>
              <kbd className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation Group Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.roles || (userRole && item.roles.includes(userRole))
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.group} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1.5">
                    {group.group}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center rounded-lg transition-all text-xs font-medium group relative ${
                        collapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-3'
                      } ${
                        active
                          ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      {!collapsed && <span className="truncate flex-1">{item.name}</span>}
                      {!collapsed && item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2'
            }`}
            title="Sign out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
