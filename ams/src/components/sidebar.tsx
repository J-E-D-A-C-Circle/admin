'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ArrowRightLeft,
  ClipboardCheck,
  FileBarChart2,
  ShieldCheck,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const SidebarLogo = ({ collapsed }: { collapsed: boolean }) => (
  <img
    src="/logo.png"
    alt="DVLA DAMS"
    className={`w-8 h-8 flex-shrink-0 ${collapsed ? '' : ''}`}
  />
);


export default function Sidebar({ onCollapseChange, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Load user profile
    const storedUser = localStorage.getItem('dams_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }

    // Load notification counts
    const fetchNotifications = async () => {
      try {
        const notifs = await api.getNotifications();
        const unread = notifs.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Error loading notification counts:', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('dams_token');
    localStorage.removeItem('dams_user');
    router.push('/login');
  };

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (onCollapseChange) onCollapseChange(next);
  };

  if (!user) return null;

  const role = user.role;

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      visible: true
    },
    {
      name: 'Asset Registry',
      icon: Package,
      path: '/assets',
      visible: true
    },

    {
      name: 'Register Asset',
      icon: PlusCircle,
      path: '/assets/register',
      visible: role === 'Super Admin' || role === 'Asset Officer'
    },
    {
      name: 'Asset Transfers',
      icon: ArrowRightLeft,
      path: '/transfers',
      visible: role === 'Super Admin' || role === 'Regional Manager' || role === 'Asset Officer'
    },
    {
      name: 'Verification Audits',
      icon: ClipboardCheck,
      path: '/verifications',
      visible: role === 'Super Admin' || role === 'Asset Officer'
    },
    {
      name: 'Reports & Export',
      icon: FileBarChart2,
      path: '/reports',
      visible: true
    },
    {
      name: 'Audit Trail',
      icon: ShieldCheck,
      path: '/audit-logs',
      visible: role === 'Super Admin' || role === 'Auditor'
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      visible: true
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden" 
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col ${
          collapsed ? 'md:w-20' : 'md:w-64'
        } w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
      {/* Brand logo header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className="flex items-center space-x-2 overflow-hidden">
          <SidebarLogo collapsed={collapsed} />
          {!collapsed && (
            <div className="flex flex-col">
              <span className={`text-sm font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                DVLA DAMS
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Official System
              </span>
            </div>
          )}
        </div>
        <button
          onClick={toggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white ml-auto flex-shrink-0"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white ml-auto flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems
          .filter((item) => item.visible)
          .map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/5 font-semibold'
                    : theme === 'dark'
                    ? 'hover:bg-slate-800 hover:text-white text-slate-300'
                    : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${collapsed ? 'mr-0' : 'mr-3'} flex-shrink-0`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
      </nav>

      {/* User info & settings footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        {!collapsed && (
          <div className="flex items-center space-x-3 mb-4 p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/40">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-100 truncate leading-snug">{user.name}</p>
              <p className="text-xs text-slate-400 truncate leading-none mt-1">{user.role}</p>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`flex items-center w-full px-3 py-2 mb-1.5 text-sm font-medium border border-slate-700/30 dark:border-transparent text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {theme === 'dark' ? (
            <Sun className={`w-5 h-5 ${collapsed ? 'mr-0' : 'mr-3'} flex-shrink-0 text-amber-400`} />
          ) : (
            <Moon className={`w-5 h-5 ${collapsed ? 'mr-0' : 'mr-3'} flex-shrink-0 text-slate-500`} />
          )}
          {!collapsed && (
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2 text-sm font-medium border border-slate-700/30 dark:border-transparent text-slate-700 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-red-500/10 hover:text-slate-900 dark:hover:text-red-300 rounded-lg transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className={`w-5 h-5 ${collapsed ? 'mr-0' : 'mr-3'} flex-shrink-0`} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
