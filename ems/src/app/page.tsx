'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Send,
  Search,
  FileCheck2,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  FileUp,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Building2,
  Calendar,
  Eye,
  Filter,
  Check,
  RotateCcw,
  Unlock,
  Building,
  Barcode,
  Truck,
  PackageCheck,
  Clock,
  Printer,
  Copy,
  ArrowRight,
  FileText,
  BadgeCheck,
  MapPin,
  ShieldAlert,
  ArrowUpRight,
  Download,
  ShieldCheck,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { EMS_PURPOSES, formatGHS, toDateInputValue } from '@/lib/ems-constants';
import EmsSidebar from '@/components/ems/EmsSidebar';
import EmsHeader from '@/components/ems/EmsHeader';

interface DispatchItem {
  id: number;
  referenceId: string;
  dispatchDate: string;
  regionId: number;
  regionName: string;
  stationId: number;
  stationName: string;
  recipientName: string;
  institution: string;
  destination: string;
  emsTrackingNumber: string;
  purpose: string;
  referenceNo: string;
  cost: string;
  hasReceipt: boolean;
  status: 'Pending' | 'Verified' | 'Rejected';
  rejectionReason: string | null;
  createdByName: string;
  createdAt: string;
}

interface MonthlyReturnItem {
  id: number;
  stationId: number;
  stationName: string;
  regionId: number;
  regionName: string;
  year: number;
  month: number;
  totalLetters: number;
  totalCost: string;
  status: 'Submitted' | 'Approved' | 'Unlocked';
  isLate: boolean;
  submittedAt: string | null;
  submittedByName: string | null;
  approvedAt: string | null;
  approvedByName: string | null;
  unlockReason: string | null;
}

interface EmsStats {
  currentPeriod: string;
  month: {
    totalLetters: number;
    totalCost: number;
    avgCostPerLetter: string;
    verifiedCount: number;
    pendingCount: number;
    rejectedCount: number;
  };
  year: {
    totalLetters: number;
    totalCost: number;
  };
  purposeBreakdown: { purpose: string; count: number; totalCost: number }[];
  topOffices: { stationId: number; stationName: string; regionName: string; letterCount: number; totalCost: number }[];
  inactiveStations: { stationId: number; stationName: string; regionName: string; lastDispatch: string | null }[];
}

interface OfficeComplianceItem {
  id: number;
  name: string;
  code: string;
  location: string;
  regionId: number;
  regionName: string;
  regionCode: string;
  compliance: 'Green' | 'Yellow' | 'Red';
  statusLabel: string;
  lettersThisMonth: number;
  costThisMonth: number;
  lastDispatchDate: string | null;
  returnStatus: string;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  eventType: string;
  actor: string;
  role: string;
  station: string;
  details: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
}

export default function EmsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'registry' | 'returns' | 'reports' | 'compliance' | 'audit'>('dashboard');

  // Dispatches state
  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);
  const [loadingDispatches, setLoadingDispatches] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [purposeFilter, setPurposeFilter] = useState('ALL');

  // Returns state
  const [returns, setReturns] = useState<MonthlyReturnItem[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);

  // Stats state
  const [stats, setStats] = useState<EmsStats | null>(null);

  // Offices Compliance state
  const [offices, setOffices] = useState<OfficeComplianceItem[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [complianceRegionFilter, setComplianceRegionFilter] = useState('ALL');
  const [complianceStatusFilter, setComplianceStatusFilter] = useState('ALL');

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilter, setAuditFilter] = useState('ALL');

  // Reports state
  const [reportType, setReportType] = useState<'detailed' | 'monthly_office' | 'national_consolidated' | 'non_compliant'>('detailed');
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitReturnModalOpen, setSubmitReturnModalOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<MonthlyReturnItem | null>(null);
  const [unlockReason, setUnlockReason] = useState('');

  // Consignment & Statement Modals
  const [consignmentModalOpen, setConsignmentModalOpen] = useState(false);
  const [consignmentItem, setConsignmentItem] = useState<DispatchItem | null>(null);
  const [pfmaModalOpen, setPfmaModalOpen] = useState(false);

  // Notifications feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create Form State
  const [createForm, setCreateForm] = useState<{
    dispatchDate: string;
    recipientName: string;
    institution: string;
    destination: string;
    emsTrackingNumber: string;
    purpose: string;
    referenceNo: string;
    cost: string;
  }>({
    dispatchDate: toDateInputValue(new Date()),
    recipientName: '',
    institution: '',
    destination: '',
    emsTrackingNumber: '',
    purpose: EMS_PURPOSES[0],
    referenceNo: '',
    cost: '25.00',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Helper date formatter for postal dispatches
  const formatDispatchDate = (val?: string) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  };

  // Load current user
  useEffect(() => {
    const stored = localStorage.getItem('dams_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const isDirectorOrAdmin = useMemo(() => {
    const role = (currentUser?.role || '').toLowerCase();
    return role.includes('director') || role.includes('super admin') || role.includes('manager');
  }, [currentUser]);

  // Fetch dispatches
  const fetchDispatches = async () => {
    try {
      setLoadingDispatches(true);
      const token = (localStorage.getItem('ems_token') || localStorage.getItem('dams_token'));
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (purposeFilter !== 'ALL') params.set('purpose', purposeFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '100');

      const res = await fetch(`/api/ems/dispatches?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      const list = data.data || data.dispatches || [];
      if (res.ok && Array.isArray(list)) {
        setDispatches(list);
      }
    } catch (err) {
      console.error('Failed to load dispatches', err);
    } finally {
      setLoadingDispatches(false);
    }
  };

  // Fetch returns
  const fetchReturns = async () => {
    try {
      setLoadingReturns(true);
      const token = (localStorage.getItem('ems_token') || localStorage.getItem('dams_token'));
      const res = await fetch('/api/ems/returns', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.returns)) {
        setReturns(data.returns);
      }
    } catch (err) {
      console.error('Failed to load returns', err);
    } finally {
      setLoadingReturns(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = (localStorage.getItem('ems_token') || localStorage.getItem('dams_token'));
      const res = await fetch('/api/ems/stats', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  // Fetch offices compliance
  const fetchOffices = async () => {
    try {
      setLoadingOffices(true);
      const token = (localStorage.getItem('ems_token') || localStorage.getItem('dams_token'));
      const res = await fetch('/api/ems/offices', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setOffices(data.data);
      }
    } catch (err) {
      console.error('Failed to load offices', err);
    } finally {
      setLoadingOffices(false);
    }
  };

  // Fetch audit logs
  const fetchAudit = async () => {
    try {
      setLoadingAudit(true);
      const token = (localStorage.getItem('ems_token') || localStorage.getItem('dams_token'));
      const res = await fetch('/api/ems/audit', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
    fetchStats();
    fetchReturns();
    fetchOffices();
    fetchAudit();
  }, []);

  // Handle Create Dispatch
  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      let receiptPath: string | undefined = undefined;
      let receiptOriginalName: string | undefined = undefined;
      let receiptMime: string | undefined = undefined;

      if (receiptFile) {
        const formData = new FormData();
        formData.append('file', receiptFile);
        const uploadRes = await fetch('/api/ems/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setActionError(uploadData.message || 'Failed to upload receipt voucher.');
          setSubmitting(false);
          return;
        }
        receiptPath = uploadData.filePath;
        receiptOriginalName = uploadData.originalName;
        receiptMime = uploadData.mimeType;
      }

      const token = (localStorage.getItem('ems_token') || localStorage.getItem('dams_token'));
      const payload = {
        ...createForm,
        receiptFile: receiptPath,
        receiptOriginalName,
        receiptMime,
      };

      const res = await fetch('/api/ems/dispatches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message || 'Failed to record postal dispatch.');
        setSubmitting(false);
        return;
      }

      setActionSuccess(`Postal Dispatch #${data.dispatch?.emsTrackingNumber || createForm.emsTrackingNumber} successfully recorded!`);
      setCreateModalOpen(false);
      setCreateForm({
        dispatchDate: toDateInputValue(new Date()),
        recipientName: '',
        institution: '',
        destination: '',
        emsTrackingNumber: '',
        purpose: EMS_PURPOSES[0],
        referenceNo: '',
        cost: '25.00',
      });
      setReceiptFile(null);
      setReceiptPreview(null);
      fetchDispatches();
      fetchStats();
      fetchAudit();
    } catch {
      setActionError('Network error while saving postal dispatch.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manager Verify / Reject
  const handleVerifyDispatch = async (dispatchId: number, status: 'Verified' | 'Rejected') => {
    setSubmitting(true);
    try {
      const token = (localStorage.getItem('ems_token') || localStorage.getItem('dams_token'));
      const res = await fetch(`/api/ems/dispatches/${dispatchId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status,
          rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message || 'Verification update failed.');
        setSubmitting(false);
        return;
      }

      setActionSuccess(`Postal Dispatch #${selectedDispatch?.emsTrackingNumber} marked as ${status}.`);
      setVerifyModalOpen(false);
      setSelectedDispatch(null);
      setRejectionReason('');
      fetchDispatches();
      fetchStats();
      fetchAudit();
    } catch {
      setActionError('Network error during verification.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Monthly Return
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = (localStorage.getItem('ems_token') || localStorage.getItem('dams_token'));
      const now = new Date();
      const res = await fetch('/api/ems/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message || 'Failed to submit monthly return.');
        setSubmitting(false);
        return;
      }

      setActionSuccess(data.message || 'Monthly return submitted to HQ Directorate successfully!');
      setSubmitReturnModalOpen(false);
      fetchReturns();
      fetchStats();
      fetchOffices();
      fetchAudit();
    } catch {
      setActionError('Network error submitting monthly return.');
    } finally {
      setSubmitting(false);
    }
  };

  // Director Approve Return
  const handleApproveReturn = async (returnId: number) => {
    if (!confirm('Approve this monthly postal reconciliation return?')) return;
    try {
      const token = (localStorage.getItem('ems_token') || localStorage.getItem('dams_token'));
      const res = await fetch(`/api/ems/returns/${returnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess('Monthly postal return approved by Directorate.');
        fetchReturns();
        fetchOffices();
        fetchAudit();
      } else {
        setActionError(data.message || 'Failed to approve return.');
      }
    } catch {
      setActionError('Network error approving return.');
    }
  };

  // Director Unlock Return
  const handleUnlockReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn || !unlockReason.trim()) return;
    setSubmitting(true);
    try {
      const token = (localStorage.getItem('ems_token') || localStorage.getItem('dams_token'));
      const res = await fetch(`/api/ems/returns/${selectedReturn.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'unlock', unlockReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess('Monthly return unlocked for editing by station officer.');
        setUnlockModalOpen(false);
        setSelectedReturn(null);
        setUnlockReason('');
        fetchReturns();
        fetchOffices();
        fetchAudit();
      } else {
        setActionError(data.message || 'Failed to unlock return.');
      }
    } catch {
      setActionError('Network error unlocking return.');
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV Helper
  const exportToCSV = (rows: any[], filename: string) => {
    if (!rows.length) {
      alert('No data available to export.');
      return;
    }
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [
      headers,
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered offices
  const filteredOffices = useMemo(() => {
    return offices.filter((o) => {
      if (complianceRegionFilter !== 'ALL' && o.regionName !== complianceRegionFilter) return false;
      if (complianceStatusFilter !== 'ALL' && o.compliance !== complianceStatusFilter) return false;
      return true;
    });
  }, [offices, complianceRegionFilter, complianceStatusFilter]);

  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(offices.map((o) => o.regionName))).filter(Boolean);
  }, [offices]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditFilter === 'ALL') return true;
      return log.eventType === auditFilter;
    });
  }, [auditLogs, auditFilter]);

  return (
    <div className="flex h-screen bg-zinc-50/70 text-zinc-900 font-sans overflow-hidden">
      {/* ── Dedicated GhanaPost EMS Sidebar (No Asset Elements) ── */}
      <EmsSidebar
        collapsed={collapsed}
        onCollapseChange={setCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          setActionError(null);
        }}
      />

      {/* ── Main Canvas ── */}
      <div
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ml-0 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Dedicated GhanaPost EMS Top Header */}
        <EmsHeader
          onToggleSidebar={() => setMobileOpen(true)}
          pendingCount={stats?.month.pendingCount || 0}
          totalLettersMonth={stats?.month.totalLetters || 0}
          totalCostMonth={stats?.month.totalCost || 0}
          onOpenNewDispatch={() => setCreateModalOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Toast / Feedback alerts */}
          {actionSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess(null)} className="p-1 hover:bg-emerald-100 rounded-lg">
                <X className="w-3.5 h-3.5 text-emerald-700" />
              </button>
            </div>
          )}

          {actionError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button onClick={() => setActionError(null)} className="p-1 hover:bg-rose-100 rounded-lg">
                <X className="w-3.5 h-3.5 text-rose-700" />
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 1: EMS DASHBOARD (Expenditure & Core Metrics - SRS 4.1)
             ══════════════════════════════════════════════════════════ */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* 4 Core SRS Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="fintech-kpi p-5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Total Cost (This Month)
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
                      {formatGHS(stats?.month.totalCost ?? 0)}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium">Postage Imprest Incurred</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                <div className="fintech-kpi p-5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Total Letters (This Month)
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                      {stats?.month.totalLetters ?? 0}
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-medium">Official Correspondence</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                </div>

                <div className="fintech-kpi p-5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Total Cost (This Year)
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-800 tracking-tight">
                      {formatGHS(stats?.year.totalCost ?? 0)}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium">{stats?.year.totalLetters ?? 0} Dispatches YTD</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-600/15 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="fintech-kpi p-5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Avg Cost Per Letter
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                      GHS {stats?.month.avgCostPerLetter ?? '0.00'}
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-medium">Tariff Efficiency Metric</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200/80 flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Station Postal Imprest Liquidity Gauge (Strictly Light Mode) */}
              <div className="p-6 bg-white fintech-card rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
                      <DollarSign className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-950">
                          Station Postage Imprest Liquidity (PFMA Act 921 § 25)
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active &bull; Reconciled
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Monthly postal operating advance for official courier tariffs &bull; DVLA Station Imprest Fund
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-auto">
                    <div className="bg-zinc-50/70 px-3 py-2 rounded-xl border border-zinc-200/80">
                      <span className="text-[10px] text-zinc-500 block uppercase font-sans font-bold">Monthly Advance</span>
                      <span className="font-bold text-zinc-950 text-sm">GHS 500.00</span>
                    </div>
                    <div className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 block uppercase font-sans font-bold">Tariffs Dispatched</span>
                      <span className="font-bold text-emerald-700 text-sm">{formatGHS(stats?.month.totalCost ?? 110)}</span>
                    </div>
                    <div className="bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-800 block uppercase font-sans font-bold">Liquid Balance</span>
                      <span className="font-bold text-amber-700 text-sm">
                        {formatGHS(Math.max(0, 500 - Number(stats?.month.totalCost ?? 110)))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Light Mode Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-zinc-600 font-semibold">
                    <span>Imprest Utilization: {Math.min(100, Math.round((Number(stats?.month.totalCost ?? 110) / 500) * 100))}%</span>
                    <span>Remaining Reserve: {Math.max(0, Math.round(100 - (Number(stats?.month.totalCost ?? 110) / 500) * 100))}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/80">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((Number(stats?.month.totalCost ?? 110) / 500) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SRS Alerts & Submission Matrix Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7-Day Inactivity & Action Alerts */}
                <div className="p-6 bg-white fintech-card rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>SRS Compliance Alerts</span>
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Section 4.1</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Monthly Return Deadline Notice */}
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Calendar className="w-4 h-4 text-blue-700" />
                        <span>Monthly Return Deadline: 5th of Month</span>
                      </div>
                      <p className="text-[11px] text-blue-700 leading-snug">
                        All verified entries auto-compile into the monthly return. Submissions auto-lock on the 5th.
                      </p>
                    </div>

                    {/* Pending Verification Notice */}
                    {(stats?.month.pendingCount ?? 0) > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-700" />
                            <span>Pending Manager Verification</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px]">
                            {stats?.month.pendingCount}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-snug">
                          {stats?.month.pendingCount} dispatches require Station Manager voucher review.
                        </p>
                      </div>
                    )}

                    {/* Inactive Stations (7-day rule) */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                        7-Day Inactivity Alerts ({stats?.inactiveStations?.length ?? 0} Offices)
                      </span>
                      {stats?.inactiveStations && stats.inactiveStations.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {stats.inactiveStations.slice(0, 4).map((st) => (
                            <div
                              key={st.stationId}
                              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-zinc-950 block">{st.stationName}</span>
                                <span className="text-[10px] text-zinc-500">{st.regionName}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-200 text-rose-800">
                                0 in 7+ Days
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                          ✓ All stations have logged correspondence in the last 7 days.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* National Office Submission Matrix (SRS 4.1) */}
                <div className="lg:col-span-2 p-6 bg-white fintech-card rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>National Office Submission Matrix</span>
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Monthly reconciliation status across national DVLA stations
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Submitted</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Pending</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>Not Submitted</span>
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Office Name</th>
                          <th className="py-2.5 px-3">Region</th>
                          <th className="py-2.5 px-3 text-right">Letters</th>
                          <th className="py-2.5 px-3 text-right">Postage Spend</th>
                          <th className="py-2.5 px-3 text-center">Status Matrix</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {offices.slice(0, 6).map((o) => (
                          <tr key={o.id} className="hover:bg-zinc-50/80 transition">
                            <td className="py-2.5 px-3 font-semibold text-zinc-950">{o.name}</td>
                            <td className="py-2.5 px-3 text-zinc-500">{o.regionName}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-800">{o.lettersThisMonth}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{formatGHS(o.costThisMonth)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  o.compliance === 'Green'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : o.compliance === 'Yellow'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {o.compliance === 'Green' ? 'Submitted' : o.compliance === 'Yellow' ? 'Pending' : 'Not Submitted'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setActiveView('compliance')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <span>View Full National Matrix & Compliance Directory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Purpose Breakdown & Top 10 Spending Offices */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost by Purpose */}
                <div className="p-6 bg-white fintech-card rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Cost Breakdown by Purpose</span>
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">SRS Section 4.1</span>
                  </div>

                  <div className="space-y-2.5">
                    {stats?.purposeBreakdown?.map((item) => (
                      <div
                        key={item.purpose}
                        className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                          <div>
                            <span className="font-bold text-zinc-950 block">{item.purpose}</span>
                            <span className="text-[10px] text-zinc-500">{item.count} dispatches</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-700 text-sm">{formatGHS(item.totalCost)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 10 Spending Offices */}
                <div className="p-6 bg-white fintech-card rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Top 10 Spending Offices</span>
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">SRS Section 4.1</span>
                  </div>

                  <div className="space-y-2">
                    {stats?.topOffices?.map((office, idx) => (
                      <div
                        key={office.stationId}
                        className="p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-zinc-950 block">{office.stationName}</span>
                            <span className="text-[10px] text-zinc-500">{office.regionName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-700 block">{formatGHS(office.totalCost)}</span>
                          <span className="text-[10px] text-zinc-400">{office.letterCount} letters</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 2: DISPATCH REGISTER (Log, Vouchers & Verify - SRS 4.2)
             ══════════════════════════════════════════════════════════ */}
          {activeView === 'registry' && (
            <div className="space-y-4">
              {/* Header & Controls */}
              <div className="p-4 bg-white fintech-card rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchDispatches()}
                    placeholder="Search recipient, tracking, or ref..."
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-zinc-950 focus:bg-white outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending">Pending Verification</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  <select
                    value={purposeFilter}
                    onChange={(e) => setPurposeFilter(e.target.value)}
                    className="bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700"
                  >
                    <option value="ALL">All Purposes</option>
                    {EMS_PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={fetchDispatches}
                    className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition"
                    title="Refresh Logbook"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition"
                  >
                    <PlusCircle className="w-4 h-4 text-white" />
                    <span>Log New Dispatch</span>
                  </button>
                </div>
              </div>

              {/* Official Dispatch Register Table */}
              <div className="bg-white fintech-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">System Ref / Tracking #</th>
                        <th className="py-3 px-3">Recipient &amp; Destination</th>
                        <th className="py-3 px-3">Purpose</th>
                        <th className="py-3 px-3 text-right">Cost (GHS)</th>
                        <th className="py-3 px-3 text-center">Voucher Receipt</th>
                        <th className="py-3 px-3">Station &amp; Officer</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-800">
                      {loadingDispatches ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-zinc-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                            <span className="mt-2 block">Loading dispatch register...</span>
                          </td>
                        </tr>
                      ) : dispatches.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-zinc-400 font-medium">
                            No dispatch records found. Click &quot;Log New Dispatch&quot; to add one.
                          </td>
                        </tr>
                      ) : (
                        dispatches.map((d) => (
                          <tr key={d.id} className="hover:bg-zinc-50/80 transition">
                            <td className="py-3 px-3 text-zinc-600 whitespace-nowrap">{formatDispatchDate(d.dispatchDate)}</td>
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-emerald-700 block">{d.emsTrackingNumber}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">{d.referenceId || d.referenceNo}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-zinc-950 block">{d.recipientName}</span>
                              <span className="text-[10px] text-zinc-500">
                                {d.institution ? `${d.institution} &bull; ` : ''}
                                {d.destination}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-zinc-600 text-[11px] font-medium">{d.purpose}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-zinc-950">{formatGHS(d.cost)}</td>
                            <td className="py-3 px-3 text-center">
                              {d.hasReceipt ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReceiptUrl(`/api/ems/dispatches/${d.id}`);
                                    setReceiptModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1 text-[11px] font-bold"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                              ) : (
                                <span className="text-zinc-400 text-[11px]">No file</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-zinc-950 block">{d.stationName}</span>
                              <span className="text-[10px] text-zinc-400">{d.createdByName || 'Officer'}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  d.status === 'Verified'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : d.status === 'Rejected'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {d.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setConsignmentItem(d);
                                  setConsignmentModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/80 transition"
                                title="Print Official Consignment Note"
                              >
                                Slip
                              </button>
                              {d.status === 'Pending' && (
                                <button
                                  onClick={() => {
                                    setSelectedDispatch(d);
                                    setVerifyModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                >
                                  Verify
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 3: MONTHLY RETURNS (Auto-Compile & HQ Sign-off - SRS 4.3)
             ══════════════════════════════════════════════════════════ */}
          {activeView === 'returns' && (
            <div className="space-y-6">
              <div className="p-6 bg-white fintech-card rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-zinc-950 tracking-tight flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-600" />
                    <span>Monthly Postal Expenditure Reconciliation (PFMA Return)</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Monthly statutory sign-off required for each DVLA station prior to central accounting reimbursement.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPfmaModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white shadow-xs flex items-center gap-2 transition"
                  >
                    <FileText className="w-4 h-4 text-white" />
                    <span>View Statutory PFMA Statement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmitReturnModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-2 transition"
                  >
                    <Send className="w-4 h-4 text-white" />
                    <span>Submit Current Month Return</span>
                  </button>
                </div>
              </div>

              {/* Returns Log Table */}
              <div className="bg-white fintech-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4">Station / Office</th>
                        <th className="py-3 px-4 text-right">Letters Dispatched</th>
                        <th className="py-3 px-4 text-right">Total Postage Spend</th>
                        <th className="py-3 px-4">Submitted By</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Directorate Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-800">
                      {loadingReturns ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-zinc-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                            <span className="mt-2 block">Loading monthly returns...</span>
                          </td>
                        </tr>
                      ) : returns.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-zinc-400 font-medium">
                            No monthly returns submitted yet. Click &quot;Submit Current Month Return&quot; above.
                          </td>
                        </tr>
                      ) : (
                        returns.map((ret) => (
                          <tr key={ret.id} className="hover:bg-zinc-50/80 transition">
                            <td className="py-3 px-4 font-bold text-zinc-950 whitespace-nowrap">
                              {ret.year}-{String(ret.month).padStart(2, '0')}
                            </td>
                            <td className="py-3 px-4 font-semibold text-zinc-950">{ret.stationName}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-zinc-800">{ret.totalLetters}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatGHS(ret.totalCost)}</td>
                            <td className="py-3 px-4 text-zinc-600 text-[11px]">{ret.submittedByName || 'Station Manager'}</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  ret.status === 'Approved'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : ret.status === 'Unlocked'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {ret.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {isDirectorOrAdmin && ret.status === 'Submitted' && (
                                <button
                                  onClick={() => handleApproveReturn(ret.id)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                >
                                  Approve HQ
                                </button>
                              )}
                              {isDirectorOrAdmin && ret.status === 'Approved' && (
                                <button
                                  onClick={() => {
                                    setSelectedReturn(ret);
                                    setUnlockModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs inline-flex items-center gap-1"
                                >
                                  <Unlock className="w-3 h-3 text-white" />
                                  <span>Unlock</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 4: REPORTS & EXPORT (Official SRS Reports - SRS 4.4)
             ══════════════════════════════════════════════════════════ */}
          {activeView === 'reports' && (
            <div className="space-y-6">
              {/* Report Selection Bar */}
              <div className="p-6 bg-white fintech-card rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-950 tracking-tight flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <span>Official DVLA EMS Statutory Reports &amp; Exports</span>
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Generate official DVLA postal expenditure schedules for Internal Audit and Ministry compliance
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        const filename = `DVLA_EMS_${reportType}_${reportYear}_${reportMonth}`;
                        if (reportType === 'detailed') {
                          exportToCSV(
                            dispatches.map((d) => ({
                              ReferenceID: d.referenceId,
                              TrackingNumber: d.emsTrackingNumber,
                              Date: d.dispatchDate,
                              Office: d.stationName,
                              Recipient: d.recipientName,
                              Institution: d.institution,
                              Destination: d.destination,
                              Purpose: d.purpose,
                              Cost_GHS: d.cost,
                              Status: d.status,
                            })),
                            filename
                          );
                        } else if (reportType === 'non_compliant') {
                          exportToCSV(
                            offices.filter((o) => o.compliance === 'Red').map((o) => ({
                              Office: o.name,
                              Region: o.regionName,
                              Status: o.statusLabel,
                              LastDispatch: o.lastDispatchDate || 'Never',
                            })),
                            filename
                          );
                        } else {
                          exportToCSV(
                            offices.map((o) => ({
                              Office: o.name,
                              Region: o.regionName,
                              LettersThisMonth: o.lettersThisMonth,
                              PostageSpend_GHS: o.costThisMonth,
                              ComplianceStatus: o.statusLabel,
                            })),
                            filename
                          );
                        }
                      }}
                      className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition"
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span>Export to Excel (CSV)</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white shadow-xs flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-4 h-4 text-white" />
                      <span>Print PDF Report</span>
                    </button>
                  </div>
                </div>

                {/* 4 Official Report Tabs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {[
                    { id: 'detailed', title: '1. Detailed Dispatch Register', desc: 'Itemized letter particulars & costs' },
                    { id: 'monthly_office', title: '2. Monthly Summary Per Office', desc: 'Aggregated letters & spend by station' },
                    { id: 'national_consolidated', title: '3. National Consolidated Summary', desc: 'HQ total expenditure across all regions' },
                    { id: 'non_compliant', title: '4. Non-Compliant Offices', desc: 'Missing returns or >7 days inactive' },
                  ].map((rep) => (
                    <button
                      key={rep.id}
                      onClick={() => setReportType(rep.id as any)}
                      className={`p-3 rounded-xl border text-left transition ${
                        reportType === rep.id
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold'
                          : 'border-zinc-200/80 bg-zinc-50/70/50 hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-bold block">{rep.title}</span>
                      <span className="text-[10px] text-zinc-500 font-normal mt-0.5 block">{rep.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Preview Display */}
              <div className="bg-white fintech-card rounded-2xl overflow-hidden">
                <div className="p-4 bg-zinc-50/70 border-b border-zinc-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-extrabold text-zinc-950 uppercase tracking-wider">
                      Report Schedule: {reportType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    Period: {reportYear}-{reportMonth.padStart(2, '0')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {reportType === 'detailed' && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200/80 text-zinc-500 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Tracking / Ref</th>
                          <th className="py-2.5 px-3">Office</th>
                          <th className="py-2.5 px-3">Recipient &amp; Destination</th>
                          <th className="py-2.5 px-3">Purpose</th>
                          <th className="py-2.5 px-3 text-right">Cost</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {dispatches.map((d) => (
                          <tr key={d.id} className="hover:bg-zinc-50/80">
                            <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap">{formatDispatchDate(d.dispatchDate)}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{d.emsTrackingNumber}</td>
                            <td className="py-2.5 px-3 font-semibold text-zinc-950">{d.stationName}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-zinc-950 block">{d.recipientName}</span>
                              <span className="text-[10px] text-zinc-400">{d.destination}</span>
                            </td>
                            <td className="py-2.5 px-3 text-zinc-600">{d.purpose}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950">{formatGHS(d.cost)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {reportType === 'monthly_office' && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200/80 text-zinc-500 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Office Name</th>
                          <th className="py-2.5 px-3">Region</th>
                          <th className="py-2.5 px-3 text-right">Letters Dispatched</th>
                          <th className="py-2.5 px-3 text-right">Total Postage Spend</th>
                          <th className="py-2.5 px-3 text-center">Reconciliation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {offices.map((o) => (
                          <tr key={o.id} className="hover:bg-zinc-50/80">
                            <td className="py-2.5 px-3 font-bold text-zinc-950">{o.name}</td>
                            <td className="py-2.5 px-3 text-zinc-500">{o.regionName}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-800">{o.lettersThisMonth}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{formatGHS(o.costThisMonth)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 text-zinc-800">
                                {o.statusLabel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {reportType === 'national_consolidated' && (
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total National Offices</span>
                          <span className="text-2xl font-black text-zinc-950">{offices.length}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Letters (Year)</span>
                          <span className="text-2xl font-black text-emerald-800">{stats?.year.totalLetters ?? 0}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Expenditure (Year)</span>
                          <span className="text-2xl font-black text-emerald-800">{formatGHS(stats?.year.totalCost ?? 0)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Regional Expenditure Consolidation
                        </h4>
                        {uniqueRegions.map((reg) => {
                          const regOffices = offices.filter((o) => o.regionName === reg);
                          const totalSpend = regOffices.reduce((acc, o) => acc + o.costThisMonth, 0);
                          const totalLetters = regOffices.reduce((acc, o) => acc + o.lettersThisMonth, 0);
                          return (
                            <div key={reg} className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-zinc-950 text-sm block">{reg} Region</span>
                                <span className="text-[11px] text-zinc-500">{regOffices.length} Offices &bull; {totalLetters} Letters</span>
                              </div>
                              <span className="font-mono font-bold text-emerald-700 text-base">{formatGHS(totalSpend)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {reportType === 'non_compliant' && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200/80 text-zinc-500 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Office Name</th>
                          <th className="py-2.5 px-3">Region</th>
                          <th className="py-2.5 px-3">Non-Compliance Issue</th>
                          <th className="py-2.5 px-3">Last Active Dispatch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-800">
                        {offices.filter((o) => o.compliance === 'Red').length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-emerald-700 font-bold">
                              ✓ All offices are fully compliant with submission deadlines and activity rules.
                            </td>
                          </tr>
                        ) : (
                          offices
                            .filter((o) => o.compliance === 'Red')
                            .map((o) => (
                              <tr key={o.id} className="hover:bg-rose-50/50">
                                <td className="py-2.5 px-3 font-bold text-zinc-950">{o.name}</td>
                                <td className="py-2.5 px-3 text-zinc-500">{o.regionName}</td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    {o.statusLabel}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-zinc-500">{formatDispatchDate(o.lastDispatchDate || undefined)}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 5: OFFICES & COMPLIANCE (National Matrix - SRS 4.5)
             ══════════════════════════════════════════════════════════ */}
          {activeView === 'compliance' && (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="p-4 bg-white fintech-card rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-950">National DVLA Office Compliance Directory</h3>
                    <p className="text-xs text-zinc-500">Live monitoring of monthly return submissions and postal activity</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={complianceRegionFilter}
                    onChange={(e) => setComplianceRegionFilter(e.target.value)}
                    className="bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700"
                  >
                    <option value="ALL">All Regions</option>
                    {uniqueRegions.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>

                  <select
                    value={complianceStatusFilter}
                    onChange={(e) => setComplianceStatusFilter(e.target.value)}
                    className="bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700"
                  >
                    <option value="ALL">All Compliance States</option>
                    <option value="Green">Green (Submitted)</option>
                    <option value="Yellow">Yellow (Pending Submission)</option>
                    <option value="Red">Red (Non-Compliant)</option>
                  </select>

                  <button
                    onClick={fetchOffices}
                    className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition"
                    title="Refresh Offices"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Office Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingOffices ? (
                  <div className="col-span-full py-12 text-center text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                    <span className="mt-2 block">Loading national office matrix...</span>
                  </div>
                ) : filteredOffices.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-zinc-400 font-medium">
                    No offices match the selected filter criteria.
                  </div>
                ) : (
                  filteredOffices.map((office) => (
                    <div
                      key={office.id}
                      className="p-5 bg-white fintech-card rounded-2xl space-y-3 hover:border-emerald-300 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                            {office.regionName} Region &bull; {office.code}
                          </span>
                          <h4 className="text-sm font-black text-zinc-950 mt-0.5">{office.name}</h4>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                            office.compliance === 'Green'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : office.compliance === 'Yellow'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {office.compliance}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-100">
                        <div>
                          <span className="text-[10px] text-zinc-400 block uppercase">Dispatches This Month</span>
                          <span className="font-bold text-zinc-950 text-sm">{office.lettersThisMonth} letters</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block uppercase">Postage Spend</span>
                          <span className="font-mono font-bold text-emerald-700 text-sm">
                            {formatGHS(office.costThisMonth)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Last Dispatch: {formatDispatchDate(office.lastDispatchDate || undefined)}</span>
                        <span className="font-semibold text-zinc-700">{office.returnStatus}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 6: AUDIT TRAIL (Tamper-Proof Logs - SRS 4.6)
             ══════════════════════════════════════════════════════════ */}
          {activeView === 'audit' && (
            <div className="space-y-4">
              <div className="p-4 bg-white fintech-card rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-950">Tamper-Proof EMS Audit Trail</h3>
                    <p className="text-xs text-zinc-500">
                      Non-deletable system logs for dispatch entries, verifications, returns, and unlock events
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={auditFilter}
                    onChange={(e) => setAuditFilter(e.target.value)}
                    className="bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700"
                  >
                    <option value="ALL">All Event Types</option>
                    <option value="DISPATCH_LOGGED">Dispatch Logged</option>
                    <option value="DISPATCH_VERIFIED">Dispatch Verified</option>
                    <option value="DISPATCH_REJECTED">Dispatch Rejected</option>
                    <option value="RETURN_SUBMITTED">Return Submitted</option>
                    <option value="RETURN_APPROVED">Return Approved</option>
                    <option value="RETURN_UNLOCKED">Return Unlocked</option>
                  </select>

                  <button
                    onClick={fetchAudit}
                    className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition"
                    title="Refresh Audit Logs"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Audit Table */}
              <div className="bg-white fintech-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Event Type</th>
                        <th className="py-3 px-4">Actor</th>
                        <th className="py-3 px-4">Station</th>
                        <th className="py-3 px-4">Event Details &amp; Justification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-800">
                      {loadingAudit ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                            <span className="mt-2 block">Loading tamper-proof audit trail...</span>
                          </td>
                        </tr>
                      ) : filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-400 font-medium">
                            No audit trail logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-zinc-50/80 transition">
                            <td className="py-3 px-4 text-zinc-500 font-mono whitespace-nowrap text-[11px]">
                              {new Date(log.timestamp).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  log.severity === 'success'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : log.severity === 'warning'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : log.severity === 'alert'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {log.eventType.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-zinc-950 block">{log.actor}</span>
                              <span className="text-[10px] text-zinc-400">{log.role}</span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-zinc-800">{log.station}</td>
                            <td className="py-3 px-4 text-zinc-700 leading-snug">{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Modal: New Postal Dispatch Entry (Light Mode) ── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200/80 bg-gradient-to-r from-emerald-50/90 to-white">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-zinc-950">New GhanaPost EMS Dispatch</h3>
                  <p className="text-[11px] text-zinc-500">Record outgoing correspondence &amp; courier fee</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDispatch} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Dispatch Date</label>
                  <input
                    type="date"
                    value={createForm.dispatchDate}
                    onChange={(e) => setCreateForm({ ...createForm, dispatchDate: e.target.value })}
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    GhanaPost Tracking Number <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.emsTrackingNumber}
                    onChange={(e) => setCreateForm({ ...createForm, emsTrackingNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. EMS-GH-99824"
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-950 uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Recipient Name / Addressee <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.recipientName}
                  onChange={(e) => setCreateForm({ ...createForm, recipientName: e.target.value })}
                  placeholder="e.g. Samuel K. Asante"
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Institution / Ministry</label>
                  <input
                    type="text"
                    value={createForm.institution}
                    onChange={(e) => setCreateForm({ ...createForm, institution: e.target.value })}
                    placeholder="e.g. Ministry of Transport"
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Destination City / Region <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.destination}
                    onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })}
                    placeholder="e.g. Kumasi Central Post"
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Document Purpose (SRS)</label>
                  <select
                    value={createForm.purpose}
                    onChange={(e) => setCreateForm({ ...createForm, purpose: e.target.value })}
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950"
                  >
                    {EMS_PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Postage Cost (GHS) <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={createForm.cost}
                    onChange={(e) => setCreateForm({ ...createForm, cost: e.target.value })}
                    placeholder="25.00"
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-950"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={createForm.referenceNo}
                  onChange={(e) => setCreateForm({ ...createForm, referenceNo: e.target.value })}
                  placeholder="e.g. DVLA/HQ/EMS-01/26"
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  GhanaPost Official Receipt Voucher (Image or PDF)
                </label>
                <div className="p-3 border-2 border-dashed border-zinc-200/80 rounded-2xl bg-zinc-50/70 text-center">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setReceiptFile(file);
                      if (file && file.type.startsWith('image/')) {
                        setReceiptPreview(URL.createObjectURL(file));
                      } else {
                        setReceiptPreview(null);
                      }
                    }}
                    className="text-xs text-zinc-600"
                  />
                  {receiptPreview && (
                    <div className="mt-2 h-24 flex items-center justify-center overflow-hidden rounded-xl border border-zinc-200/80">
                      <img src={receiptPreview} alt="Receipt preview" className="h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>Submit Postal Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Receipt Image Viewer (Light Mode) ── */}
      {receiptModalOpen && activeReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200/80 bg-zinc-50/70">
              <h3 className="font-bold text-sm text-zinc-950">GhanaPost Official Receipt Voucher</h3>
              <button onClick={() => setReceiptModalOpen(false)} className="p-1 hover:bg-zinc-100 rounded-lg">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-zinc-100">
              <img src={activeReceiptUrl} alt="GhanaPost Receipt" className="max-h-[65vh] object-contain rounded-lg border border-zinc-200/80" />
            </div>
            <div className="p-3 border-t border-zinc-200/80 flex justify-end bg-zinc-50/70">
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Manager Verify / Reject (Light Mode) ── */}
      {verifyModalOpen && selectedDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="font-black text-sm text-zinc-950">Station Manager Verification Audit</h3>
            <p className="text-xs text-zinc-600">
              Audit dispatch <span className="font-mono font-bold text-emerald-700">{selectedDispatch.emsTrackingNumber}</span> for recipient{' '}
              <span className="font-semibold text-zinc-800">{selectedDispatch.recipientName}</span> (Cost: {formatGHS(selectedDispatch.cost)}).
            </p>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Rejection Reason (mandatory if rejecting)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Missing receipt image, incorrect cost, or unreadable tracking number..."
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-950 outline-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleVerifyDispatch(selectedDispatch.id, 'Rejected')}
                disabled={submitting || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50"
              >
                Reject Dispatch
              </button>
              <button
                type="button"
                onClick={() => handleVerifyDispatch(selectedDispatch.id, 'Verified')}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Verify &amp; Sign Off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Submit Monthly Return (Light Mode) ── */}
      {submitReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-sm text-zinc-950">Submit Monthly Postal Return to HQ</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              This will compile and lock all outgoing correspondence dispatches and GhanaPost receipt costs for the current calendar month and transmit them to the Director of Administration for audit sign-off.
            </p>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold space-y-1">
              <div>Total Outgoing Letters: {stats?.month.totalLetters ?? 0}</div>
              <div>Total Postage Expenditure: {formatGHS(stats?.month.totalCost ?? 0)}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSubmitReturnModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Confirm &amp; Transmit Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Unlock Return (Director Reason Modal) ── */}
      {unlockModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form onSubmit={handleUnlockReturn} className="bg-white border border-zinc-200/80 rounded-3xl shadow-xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-sm text-zinc-950">Director HQ: Unlock Return</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Unlocking return for <span className="font-bold text-zinc-950">{selectedReturn.stationName}</span> ({selectedReturn.year}-{String(selectedReturn.month).padStart(2, '0')}). Mandatory justification is required for the permanent audit trail.
            </p>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Reason / Justification for Unlocking</label>
              <textarea
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Station officer requested amendment to receipt voucher amount..."
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-950 outline-none"
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUnlockModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !unlockReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs disabled:opacity-50"
              >
                Unlock &amp; Notify Station
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: Official GhanaPost EMS Courier Consignment Note (Printable Waybill - Light Mode) ── */}
      {consignmentModalOpen && consignmentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 bg-zinc-50/70 border-b border-zinc-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-950">
                  GhanaPost EMS Courier Consignment Note (Form EMS-01)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConsignmentModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Consignment Body */}
            <div className="p-6 sm:p-8 space-y-5 bg-white text-zinc-950 font-sans print:p-0">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase tracking-widest text-zinc-950">
                      REPUBLIC OF GHANA
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider">
                      OFFICIAL COURIER
                    </span>
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-zinc-950 leading-none">
                    DRIVER AND VEHICLE LICENSING AUTHORITY
                  </h2>
                  <p className="text-xs font-semibold text-zinc-600">
                    Transport &amp; Postal Logistics Division &bull; Head Office &amp; Station Network
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 font-mono text-right">
                    <span className="block text-[9px] uppercase font-bold text-zinc-500">GhanaPost EMS Code</span>
                    <span className="text-base font-black tracking-wider text-emerald-800">{consignmentItem.emsTrackingNumber}</span>
                  </div>
                </div>
              </div>

              {/* Barcode Strip */}
              <div className="p-4 bg-zinc-50/70 border border-zinc-200/80 rounded-xl text-center space-y-2 font-mono">
                <div className="flex items-center justify-center space-x-1 py-1">
                  {[4, 2, 7, 3, 5, 2, 6, 4, 8, 3, 6, 2, 5, 4, 7, 3, 5, 2, 6, 3, 7, 4, 8, 2, 6, 3, 5, 2].map((w, i) => (
                    <div key={i} style={{ width: `${w}px` }} className="h-12 bg-slate-900 shrink-0" />
                  ))}
                </div>
                <span className="text-xs font-black tracking-widest text-zinc-950 block">
                  *{consignmentItem.emsTrackingNumber}*
                </span>
              </div>

              {/* Sender & Consignee 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-200/80 pb-1.5">
                    <span className="font-black text-[10px] uppercase tracking-wider text-zinc-500">
                      1. ORIGINATING STATION (SENDER)
                    </span>
                    <Building className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Station:</span>
                    <span className="font-bold text-zinc-950 text-sm">DVLA {consignmentItem.stationName} Station</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Dispatching Officer:</span>
                    <span className="font-semibold text-zinc-800">{consignmentItem.createdByName || 'EMS Station Officer'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Dispatch Reference:</span>
                    <span className="font-mono font-bold text-zinc-800">{consignmentItem.referenceId || consignmentItem.referenceNo}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-200/80 pb-1.5">
                    <span className="font-black text-[10px] uppercase tracking-wider text-zinc-500">
                      2. CONSIGNMENT DESTINATION (RECIPIENT)
                    </span>
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Recipient Consignee:</span>
                    <span className="font-bold text-zinc-950 text-sm">{consignmentItem.recipientName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Institution / Department:</span>
                    <span className="font-semibold text-zinc-800">{consignmentItem.institution || 'Official Consignee'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Destination Office / Town:</span>
                    <span className="font-bold text-emerald-800">{consignmentItem.destination}</span>
                  </div>
                </div>
              </div>

              {/* Consignment Particulars Table */}
              <div className="border border-zinc-200/80 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3 border-b border-zinc-200/80">Document Classification</th>
                      <th className="py-2 px-3 border-b border-zinc-200/80">Date Logged</th>
                      <th className="py-2 px-3 border-b border-zinc-200/80">Postage Imprest Fee</th>
                      <th className="py-2 px-3 border-b border-zinc-200/80 text-center">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-zinc-950">{consignmentItem.purpose}</td>
                      <td className="py-2.5 px-3 text-zinc-600">{formatDispatchDate(consignmentItem.dispatchDate)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 text-sm">
                        {formatGHS(consignmentItem.cost)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {consignmentItem.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50/70 border-t border-zinc-200/80 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-medium">
                Official DVLA Form EMS-01 &bull; Printable on Standard Courier Slips
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConsignmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Statutory PFMA Monthly Postal Statement (Light Mode) ── */}
      {pfmaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="p-4 sm:px-6 bg-zinc-50/70 border-b border-zinc-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-950">
                  Statutory PFMA Monthly Postal Return (Act 921 &bull; Form EMS-PFMA-01)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPfmaModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Statement Content */}
            <div className="p-6 sm:p-8 space-y-6 bg-white text-zinc-950 print:p-0">
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  REPUBLIC OF GHANA &bull; PUBLIC FINANCIAL MANAGEMENT ACT (ACT 921)
                </span>
                <h2 className="text-lg font-black tracking-tight text-zinc-950 uppercase">
                  Driver and Vehicle Licensing Authority (DVLA)
                </h2>
                <h3 className="text-sm font-bold text-emerald-800">
                  MONTHLY POSTAGE IMPREST LIQUIDATION &amp; CORRESPONDENCE DISPATCH STATEMENT
                </h3>
                <p className="text-xs text-zinc-600">
                  Accounting Period: October 2026 &bull; Sub-Vote: Official Postal Logistics &amp; Expedited Mail Service
                </p>
              </div>

              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Reporting Station</span>
                  <span className="font-bold text-zinc-950 block text-sm">DVLA Accra 37</span>
                </div>
                <div className="p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Monthly Imprest Advance</span>
                  <span className="font-mono font-bold text-zinc-950 block text-sm">GHS 500.00</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Total Tariffs Dispatched</span>
                  <span className="font-mono font-bold text-emerald-800 block text-sm">
                    {formatGHS(stats?.month.totalCost ?? 110)}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-700">Liquid Imprest Balance</span>
                  <span className="font-mono font-bold text-amber-800 block text-sm">
                    {formatGHS(Math.max(0, 500 - Number(stats?.month.totalCost ?? 110)))}
                  </span>
                </div>
              </div>

              {/* Itemized Dispatches */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">
                  Itemized Schedule of Official Dispatches
                </h4>
                <div className="border border-zinc-200/80 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Tracking / Waybill</th>
                        <th className="py-2 px-3">Recipient &amp; Destination</th>
                        <th className="py-2 px-3">Classification</th>
                        <th className="py-2 px-3 text-right">Tariff (GHS)</th>
                        <th className="py-2 px-3 text-center">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {dispatches.map((d) => (
                        <tr key={d.id}>
                          <td className="py-2 px-3 text-zinc-600 whitespace-nowrap">{formatDispatchDate(d.dispatchDate)}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-800">{d.emsTrackingNumber}</td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-zinc-950 block">{d.recipientName}</span>
                            <span className="text-[10px] text-zinc-500">{d.destination}</span>
                          </td>
                          <td className="py-2 px-3 text-zinc-700">{d.purpose}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-zinc-950">{formatGHS(d.cost)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-50/70 font-bold text-zinc-950 border-t border-zinc-200/80">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[10px]">
                          Total Statutory Outlay Reconciled:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                          {formatGHS(stats?.month.totalCost ?? 110)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-[10px] text-emerald-700">100% Compliant</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Dual Sign-off Blocks */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="border-t-2 border-slate-400 pt-2 text-xs space-y-1">
                  <span className="font-bold text-zinc-950 block">Station Manager Verification</span>
                  <span className="text-zinc-600 block">DVLA Station Head</span>
                  <span className="text-[10px] text-zinc-400 block font-mono">Date Certified: 14 October 2026</span>
                </div>

                <div className="border-t-2 border-slate-400 pt-2 text-xs space-y-1">
                  <span className="font-bold text-zinc-950 block">HQ Directorate Approval</span>
                  <span className="text-zinc-600 block">Director of Administration &bull; DVLA Head Office</span>
                  <span className="text-[10px] text-emerald-700 block font-mono font-bold">Approved &amp; Reimbursed</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50/70 border-t border-zinc-200/80 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-medium">
                PFMA Statutory Return Document &bull; Print for Central Audit &amp; Station Records
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPfmaModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Print Official PFMA Return</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
