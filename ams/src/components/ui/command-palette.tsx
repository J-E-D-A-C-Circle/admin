'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Package,
  PlusCircle,
  ArrowRightLeft,
  FileSpreadsheet,
  ClipboardCheck,
  FileText,
  MapPin,
  Settings,
  X,
  History
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  keywords?: string[];
}

const COMMANDS: CommandItem[] = [
  { id: 'dash', title: 'Dashboard & KPI Overview', category: 'Navigation', icon: LayoutDashboard, href: '/dashboard', keywords: ['home', 'analytics', 'kpi'] },
  { id: 'assets', title: 'Asset Registry & Search', category: 'Assets', icon: Package, href: '/assets', keywords: ['inventory', 'list', 'filter'] },
  { id: 'register', title: 'Register New Asset', category: 'Assets', icon: PlusCircle, href: '/assets/register', keywords: ['add', 'new', 'create'] },
  { id: 'transfers', title: 'Asset Transfers & Relocations', category: 'Operations', icon: ArrowRightLeft, href: '/transfers', keywords: ['move', 'station', 'assign'] },
  { id: 'import', title: 'Batch CSV Asset Import', category: 'Operations', icon: FileSpreadsheet, href: '/import', keywords: ['upload', 'bulk', 'excel'] },
  { id: 'verifications', title: 'Physical Audit Verifications', category: 'Audit', icon: ClipboardCheck, href: '/verifications', keywords: ['scan', 'barcode', 'check'] },
  { id: 'audit-logs', title: 'System Audit Trail', category: 'Audit', icon: History, href: '/audit-logs', keywords: ['logs', 'history', 'security'] },
  { id: 'reports', title: 'Executive Reports & Valuation', category: 'Reports', icon: FileText, href: '/reports', keywords: ['export', 'depreciation', 'pdf'] },
  { id: 'map', title: 'Regional Distribution Map', category: 'Navigation', icon: MapPin, href: '/map', keywords: ['stations', 'regions', 'geography'] },
  { id: 'settings', title: 'System & Classification Settings', category: 'Administration', icon: Settings, href: '/settings', keywords: ['config', 'categories', 'departments'] },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.includes(q))
    );
  }, [query]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(filtered[selectedIndex].href);
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, selectedIndex, router, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Search header */}
        <div className="flex items-center px-4 border-b border-slate-800 bg-slate-950/40">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search sections... (e.g. registry, reports)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-3.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching pages or actions found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    onOpenChange(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-500/15 text-amber-300' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-500">
          <span>Navigate with <kbd className="px-1 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">↓</kbd></span>
          <span>Open with <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">↵</kbd></span>
        </div>
      </div>
    </div>
  );
}
