'use client';

import React, { useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, AlertTriangle, Sun, Moon, Menu } from 'lucide-react';
import { FleetProvider, useFleet } from '../context/FleetContext';
import Sidebar from './Sidebar';

function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();
  const { vehicles, maintenanceLogs, theme, toggleTheme } = useFleet();
  
  const getDaysDifference = (dateStr: string) => {
    const target = new Date(dateStr);
    const current = new Date('2026-06-12');
    const diffTime = target.getTime() - current.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Compute critical alerts globally for header badge
  const criticalCount = useMemo(() => {
    let count = 0;
    // Expired road worthy
    vehicles.forEach(v => {
      if (getDaysDifference(v.roadWorthyExpiry) < 0) count++;
    });
    // Overdue maintenance
    maintenanceLogs.forEach(log => {
      if (log.status === 'Pending' && getDaysDifference(log.serviceDate) < 0) count++;
    });
    return count;
  }, [vehicles, maintenanceLogs]);

  // Dynamic routing titles
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return { title: 'Dashboard Monitor', subtitle: 'System Dashboard & Real-Time Sync' };
      case '/vehicles':
        return { title: 'Fleet Registry', subtitle: 'Search, Filter, and Register Units' };
      case '/drivers':
        return { title: 'Driver Management', subtitle: 'Register, Edit, and Monitor Operators' };

      case '/maintenance':
        return { title: 'Maintenance & Parts', subtitle: 'Schedule Operations & Parts Tallies' };
      case '/fuel':
        return { title: 'Fuel Tracking', subtitle: 'Consumption Metrics & Efficiency Graphs' };
      case '/reports':
        return { title: 'Performance Reports', subtitle: 'Custom Monthly Report Certificates' };
      case '/logs':
        return { title: 'System Activity Logs', subtitle: 'Collapsible Unit History, Fuel Dispatches, and Repairs' };
      case '/settings':
        return { title: 'Admin Settings', subtitle: 'Configure Depot Stations & Warning Limits' };
      default:
        return { title: 'Fleet Monitor', subtitle: 'DVLA Accra Central System' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="top-header no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={onToggleSidebar}
          className="mobile-menu-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-title)',
            cursor: 'pointer',
            padding: 0,
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Menu style={{ height: '24px', width: '24px' }} />
        </button>
        <div className="header-info">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="header-actions">
        {/* Theme Toggler Button */}
        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary" 
          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <>
              <Sun style={{ height: '14px', width: '14px', color: 'var(--primary-gold)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-main)' }}>Light Mode</span>
            </>
          ) : (
            <>
              <Moon style={{ height: '14px', width: '14px', color: 'var(--accent-blue)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-main)' }}>Dark Mode</span>
            </>
          )}
        </button>

        <div className="header-date">
          <Calendar style={{ height: '14px', width: '14px' }} />
          <span>June 12, 2026 (Operational Date)</span>
        </div>

        {criticalCount > 0 && (
          <div className="header-critical-alerts">
            <AlertTriangle style={{ height: '14px', width: '14px' }} />
            <span>{criticalCount} Critical Alerts</span>
          </div>
        )}
      </div>
    </header>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useFleet();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  
  // Update html and body classes reactively
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.body.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.body.classList.remove('light');
      }
    }
  }, [theme]);

  // Remove preload class to enable transitions after initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        document.body.classList.remove('preload');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="app-container">
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div 
        className={`sidebar-overlay ${mobileSidebarOpen ? 'active' : ''}`} 
        onClick={() => setMobileSidebarOpen(false)} 
      />
      <div className="main-content">
        <Header onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)} />
        {children}
      </div>
    </div>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FleetProvider>
      <MainLayout>{children}</MainLayout>
    </FleetProvider>
  );
}
