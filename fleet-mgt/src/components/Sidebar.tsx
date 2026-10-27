'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Wrench,
  Fuel,
  FileText,
  User,
  Activity,
  Settings,
  History,
  X
} from 'lucide-react';
import { useFleet } from '@/context/FleetContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { systemSettings } = useFleet();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} no-print`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Brand Logo Header */}
        <div className="brand-header" style={{ position: 'relative' }}>
          <div className="brand-icon" style={{ background: '#ffffff', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px' }}>
            <img 
              src="/logo.png" 
              alt="DVLA Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <div className="brand-title">
            <h1>DVLA PORTAL</h1>
            <p>Fleet & Operations</p>
          </div>
          {onClose && (
            <button 
              className="mobile-close-btn" 
              onClick={onClose}
              style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
              title="Close Menu"
            >
              <X style={{ height: '20px', width: '20px' }} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="nav-links">
          <Link
            href="/"
            className={`nav-button ${pathname === '/' ? 'active' : ''}`}
          >
            <LayoutDashboard style={{ height: '20px', width: '20px' }} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/vehicles"
            className={`nav-button ${pathname === '/vehicles' ? 'active' : ''}`}
          >
            <Car style={{ height: '20px', width: '20px' }} />
            <span>Fleet Registry</span>
          </Link>
          <Link
            href="/drivers"
            className={`nav-button ${pathname === '/drivers' ? 'active' : ''}`}
          >
            <User style={{ height: '20px', width: '20px' }} />
            <span>Driver Management</span>
          </Link>

          <Link
            href="/maintenance"
            className={`nav-button ${pathname === '/maintenance' ? 'active' : ''}`}
          >
            <Wrench style={{ height: '20px', width: '20px' }} />
            <span>Maintenance & Parts</span>
          </Link>
          <Link
            href="/fuel"
            className={`nav-button ${pathname === '/fuel' ? 'active' : ''}`}
          >
            <Fuel style={{ height: '20px', width: '20px' }} />
            <span>Fuel tracking</span>
          </Link>
          <Link
            href="/reports"
            className={`nav-button ${pathname === '/reports' ? 'active' : ''}`}
          >
            <FileText style={{ height: '20px', width: '20px' }} />
            <span>Performance Reports</span>
          </Link>
          <Link
            href="/logs"
            className={`nav-button ${pathname === '/logs' ? 'active' : ''}`}
          >
            <History style={{ height: '20px', width: '20px' }} />
            <span>Activity Logs</span>
          </Link>
          <Link
            href="/settings"
            className={`nav-button ${pathname === '/settings' ? 'active' : ''}`}
          >
            <Settings style={{ height: '20px', width: '20px' }} />
            <span>Admin Settings</span>
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <User style={{ height: '18px', width: '18px' }} />
          </div>
          <div className="user-info">
            <p>{systemSettings.adminName}</p>
            <span>{systemSettings.adminBranch}</span>
          </div>
        </div>
        <div className="server-status">
          <span>Server: Connected</span>
          <span className="status-dot pulse-active"></span>
        </div>
      </div>
    </aside>
  );
}
