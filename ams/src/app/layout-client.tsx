'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import { ThemeProvider } from '@/lib/theme-context';
import { Menu } from 'lucide-react';

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    // Basic route protection on mount
    const token = localStorage.getItem('dams_token');
    if (!token && !isLoginPage) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return (
      <ThemeProvider>
        <div className="h-full flex items-center justify-center bg-slate-950">{children}</div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col md:flex-row h-screen print:h-auto overflow-hidden print:overflow-visible bg-slate-950 print:bg-white">
        
        {/* Mobile Header */}
        <div className="md:hidden print:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 shrink-0 relative z-30">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="DVLA DAMS" className="w-8 h-8" />
            <span className="text-base font-bold text-white leading-none">DVLA DAMS</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="print:hidden">
          <Sidebar 
            onCollapseChange={setCollapsed} 
            mobileOpen={mobileOpen} 
            onCloseMobile={() => setMobileOpen(false)} 
          />
        </div>
        
        <main
          className={`flex-1 overflow-y-auto print:overflow-visible p-4 sm:p-6 md:p-8 print:p-0 transition-all duration-300 ml-0 ${
            collapsed ? 'md:ml-20' : 'md:ml-64'
          } print:ml-0`}
        >
          <div className="max-w-7xl print:max-w-none mx-auto space-y-6 print:space-y-0">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
