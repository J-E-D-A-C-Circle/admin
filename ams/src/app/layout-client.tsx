'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import { AppHeader } from '@/components/app-header';
import { CommandPalette } from '@/components/ui/command-palette';
import { ThemeProvider } from '@/lib/theme-context';
import { Menu } from 'lucide-react';

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    // Strict route protection before rendering any protected screen
    const token = localStorage.getItem('dams_token');
    if (!token && !isLoginPage) {
      setAuthed(false);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else {
      setAuthed(!!token);
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return (
      <ThemeProvider>
        <div className="h-full flex items-center justify-center bg-slate-950">{children}</div>
      </ThemeProvider>
    );
  }

  if (!authed) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
        {/* Global Keyboard-Driven Command Palette */}
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
        />

        {/* Inset Sidebar */}
        <div className="print:hidden">
          <Sidebar
            onCollapseChange={setCollapsed}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          />
        </div>

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            collapsed ? 'md:ml-20' : 'md:ml-64'
          }`}
        >
          {/* Top Inset Application Header */}
          <div className="print:hidden">
            <AppHeader onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
          </div>

          {/* Scrollable Viewport */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 print:p-0">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
