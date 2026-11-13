'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Search,
  Filter,
  ArrowLeftRight,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Transfer = {
  id: number;
  assetId: string;
  assetName: string;
  fromStation: string;
  toStation: string;
  fromRegion: string;
  toRegion: string;
  fromDepartment: string;
  toDepartment: string;
  previousEmployee?: string | null;
  newEmployee?: string | null;
  transferredByUsername?: string | null;
  reason: string;
  transferDate: string;
  transferredBy: string;
  status: string;
  approvedByUserId?: number;
  approvalDate?: string;
  signatureUrl?: string;
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [lookups, setLookups] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  const limit = 15;

  const [form, setForm] = useState({
    assetId: '',
    toRegionId: '',
    toStationId: '',
    toDepartmentId: '',
    newEmployeeId: '',
    reason: '',
  });

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAssetIds, setBulkAssetIds] = useState('');
  const [expandedTransferId, setExpandedTransferId] = useState<number | null>(null);

  const [filteredStations, setFilteredStations] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [assetSuggestions, setAssetSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, [page, search]);

  useEffect(() => {
    api.getLookups().then(setLookups).catch(console.error);
    const u = localStorage.getItem('dams_user');
    if (u) {
      setUserRole(JSON.parse(u).role);
    }
    if (typeof window !== 'undefined') {
      const prefillId = new URLSearchParams(window.location.search).get('assetId');
      if (prefillId) {
        openTransferModal(prefillId);
      }
    }
  }, []);

  const openTransferModal = async (assetId: string) => {
    setForm({
      assetId,
      toRegionId: '',
      toStationId: '',
      toDepartmentId: '',
      newEmployeeId: '',
      reason: '',
    });
    setError('');
    setShowSuggestions(false);
    setShowModal(true);
    if (assetId.trim()) {
      try {
        const a = await api.getAsset(assetId.trim());
        setForm((prev) => ({
          ...prev,
          toRegionId: a.regionId ? String(a.regionId) : '',
          toStationId: a.stationId ? String(a.stationId) : '',
          toDepartmentId: a.departmentId ? String(a.departmentId) : '',
        }));
      } catch {
        // Ignore if asset not found yet
      }
    }
  };

  useEffect(() => {
    if (form.toRegionId && lookups.stations) {
      setFilteredStations(lookups.stations.filter((s: any) => s.regionId === parseInt(form.toRegionId)));
      setForm((prev) => ({ ...prev, toStationId: '', newEmployeeId: '' }));
    }
  }, [form.toRegionId, lookups.stations]);

  useEffect(() => {
    if (form.toStationId && lookups.employees) {
      setFilteredEmployees(lookups.employees.filter((e: any) => e.stationId === parseInt(form.toStationId)));
      setForm((prev) => ({ ...prev, newEmployeeId: '' }));
    }
  }, [form.toStationId, lookups.employees]);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const data = await api.getTransfers({ page, limit, search });
      setTransfers(data.data || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.transferAsset({
        assetId: form.assetId,
        toRegionId: parseInt(form.toRegionId),
        toStationId: parseInt(form.toStationId),
        toDepartmentId: parseInt(form.toDepartmentId),
        newEmployeeId: form.newEmployeeId ? parseInt(form.newEmployeeId) : null,
        reason: form.reason,
      });
      setSuccessMsg('Transfer initiated and pending approval.');
      setShowModal(false);
      setForm({ assetId: '', toRegionId: '', toStationId: '', toDepartmentId: '', newEmployeeId: '', reason: '' });
      fetchTransfers();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const ids = bulkAssetIds.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length === 0) throw new Error('Please enter at least one Asset ID');

      await api.bulkTransferAssets({
        assetIds: ids,
        toRegionId: parseInt(form.toRegionId),
        toStationId: parseInt(form.toStationId),
        toDepartmentId: parseInt(form.toDepartmentId),
        reason: form.reason,
      });
      setSuccessMsg(`Bulk transfers initiated for ${ids.length} assets.`);
      setShowBulkModal(false);
      setForm({ assetId: '', toRegionId: '', toStationId: '', toDepartmentId: '', newEmployeeId: '', reason: '' });
      setBulkAssetIds('');
      fetchTransfers();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate bulk transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  const inputClass =
    'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-200 text-sm placeholder-slate-600 focus:outline-none';
  const selectClass =
    'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-300 text-sm focus:outline-none';
  const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  const canTransfer = userRole === 'Super Admin' || userRole === 'Asset Officer';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Transfers</h1>
          <p className="text-sm text-slate-400">Record and view all asset transfers between stations</p>
        </div>
        {canTransfer && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm w-full sm:w-auto"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Bulk Transfer</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm w-full sm:w-auto"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">New Transfer</span>
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="flex items-center space-x-2 p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-200 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-auto text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search asset ID or station..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 px-2 py-3">
            {transfers.map((t) => (
              <div key={`mobile-t-${t.id}`} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2.5 gap-2">
                    <div className="flex space-x-3 items-center flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <ArrowLeftRight className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-200 text-sm leading-tight truncate">{t.assetName}</h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.assetId}</p>
                      </div>
                    </div>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold border rounded flex-shrink-0 ${t.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                      {t.status === 'Approved' ? 'Completed' : (t.status || 'Completed')}
                    </span>
                  </div>

                  <div className="bg-slate-950/30 rounded-lg p-2.5 grid grid-cols-2 gap-y-2 gap-x-2 text-xs mb-1">
                    <div>
                      <span className="text-slate-500 block mb-0.5">From</span>
                      <span className="font-medium text-slate-300 block truncate">{t.fromStation}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{t.fromDepartment} • {t.previousEmployee || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">To</span>
                      <span className="font-medium text-slate-300 block truncate">{t.toStation}</span>
                      <span className="text-[10px] text-emerald-400/90 block truncate">{t.toDepartment} • {t.newEmployee || 'Unassigned'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block mb-0.5">Reason</span>
                      <span className="font-medium text-slate-300 truncate block">{t.reason}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 px-3 py-2.5 flex items-center justify-between bg-slate-900 mt-auto">
                  <div className="text-[10px] text-slate-400">
                    {t.transferredBy || 'System'}{t.transferredByUsername ? ` (@${t.transferredByUsername})` : ''} • {new Date(t.transferDate).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="w-10 px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">From</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">To</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                      No transfers found.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => {
                    const isExpanded = expandedTransferId === t.id;
                    return (
                      <React.Fragment key={t.id}>
                        <tr
                          onClick={() => setExpandedTransferId(isExpanded ? null : t.id)}
                          className="border-t border-slate-800/60 hover:bg-slate-800/30 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              aria-label={isExpanded ? 'Collapse transfer trail' : 'Expand transfer trail'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedTransferId(isExpanded ? null : t.id);
                              }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-amber-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs text-amber-400 mb-0.5">{t.assetId}</div>
                            <div className="text-slate-200 text-sm font-medium truncate max-w-[200px]">{t.assetName}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-200">{t.fromStation}</div>
                            <div className="text-xs text-slate-500">{t.fromRegion}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-200">{t.toStation}</div>
                            <div className="text-xs text-slate-500">{t.toRegion}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{t.reason}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${t.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                              {t.status === 'Approved' ? 'Completed' : (t.status || 'Completed')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                            {new Date(t.transferDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{t.transferredBy || 'System'}</td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-950/60 border-t border-slate-800/40">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold uppercase tracking-wider text-amber-400">Transfer Trail</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-slate-300">
                                      Account Responsible:{' '}
                                      <span className="font-semibold text-white">{t.transferredBy || 'System'}</span>
                                      {t.transferredByUsername && (
                                        <span className="ml-1 font-mono text-slate-400">(@{t.transferredByUsername})</span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="text-slate-400 font-mono">
                                    Timestamp: {new Date(t.transferDate).toLocaleString()}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  <div className="rounded-md bg-slate-950/60 border border-slate-800/80 p-3 space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">From (Previous)</p>
                                    <p className="text-slate-200 font-semibold">{t.fromStation || 'N/A'}</p>
                                    <p className="text-slate-400">Region: <span className="text-slate-200">{t.fromRegion || 'N/A'}</span></p>
                                    <p className="text-slate-400">Department: <span className="text-slate-200">{t.fromDepartment || 'N/A'}</span></p>
                                    <p className="text-slate-400">Custodian: <span className="text-slate-200">{t.previousEmployee || 'Unassigned'}</span></p>
                                  </div>

                                  <div className="rounded-md bg-slate-950/60 border border-emerald-900/40 p-3 space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">To (Updated)</p>
                                    <p className="text-white font-semibold">{t.toStation || 'N/A'}</p>
                                    <p className="text-slate-400">Region: <span className="text-slate-200">{t.toRegion || 'N/A'}</span></p>
                                    <p className="text-slate-400">Department: <span className="text-slate-200">{t.toDepartment || 'N/A'}</span></p>
                                    <p className="text-slate-400">Custodian: <span className="text-emerald-300 font-medium">{t.newEmployee || 'Unassigned'}</span></p>
                                  </div>
                                </div>

                                <div className="text-xs text-slate-400">
                                  <span className="font-semibold text-slate-300">Reason: </span>
                                  {t.reason}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-slate-800 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {Math.min((page - 1) * limit + 1, totalCount)}–{Math.min(page * limit, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">New Asset Transfer</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-start space-x-2 p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset ID *</label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!form.assetId.trim()) return;
                      try {
                        const a = await api.getAsset(form.assetId.trim());
                        setForm((prev: any) => ({
                          ...prev,
                          toRegionId: a.regionId ? String(a.regionId) : prev.toRegionId,
                          toStationId: a.stationId ? String(a.stationId) : prev.toStationId,
                          toDepartmentId: a.departmentId ? String(a.departmentId) : prev.toDepartmentId,
                        }));
                        setError('');
                      } catch {
                        setError(`Asset "${form.assetId.trim()}" not found.`);
                      }
                    }}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                  >
                    Pre-fill current office &amp; dept
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.assetId}
                    onChange={async (e) => {
                      const val = e.target.value;
                      updateForm('assetId', val);
                      if (val.trim().length >= 2) {
                        try {
                          const res = await api.getAssets({ search: val.trim(), limit: 8 });
                          setAssetSuggestions(res.data || []);
                          setShowSuggestions(true);
                        } catch {
                          setAssetSuggestions([]);
                        }
                      } else {
                        setAssetSuggestions([]);
                        setShowSuggestions(false);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                    className={inputClass}
                    placeholder="Search by Asset ID, name, or serial number..."
                  />
                  {showSuggestions && assetSuggestions.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 shadow-xl divide-y divide-slate-800/70">
                      {assetSuggestions.map((a: any) => (
                        <button
                          key={a.assetId}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setForm((prev) => ({
                              ...prev,
                              assetId: a.assetId,
                              toRegionId: a.regionId ? String(a.regionId) : prev.toRegionId,
                              toStationId: a.stationId ? String(a.stationId) : prev.toStationId,
                              toDepartmentId: a.departmentId ? String(a.departmentId) : prev.toDepartmentId,
                            }));
                            setShowSuggestions(false);
                            setError('');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-800/80 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-amber-400">{a.assetId}</span>
                            <span className="text-slate-400">{a.stationName}</span>
                          </div>
                          <div className="text-xs text-slate-200 truncate">{a.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  You can transfer to another station/department or keep the same office &amp; department to reassign custodian.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Destination Region *</label>
                  <Select
                    value={form.toRegionId}
                    onValueChange={(val) => updateForm('toRegionId', val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookups.regions?.map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelClass}>Destination Station *</label>
                  <Select
                    value={form.toStationId}
                    onValueChange={(val) => updateForm('toStationId', val)}
                    disabled={!form.toRegionId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStations.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Destination Dept *</label>
                  <Select
                    value={form.toDepartmentId}
                    onValueChange={(val) => updateForm('toDepartmentId', val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select dept" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookups.departments?.map((d: any) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelClass}>New Employee</label>
                  <Select
                    value={form.newEmployeeId || 'unassigned'}
                    onValueChange={(val) => updateForm('newEmployeeId', val === 'unassigned' ? '' : val)}
                    disabled={!form.toStationId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {filteredEmployees.map((e: any) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={form.reason}
                  onChange={(e) => updateForm('reason', e.target.value)}
                  className={inputClass}
                  placeholder="Reason for transfer..."
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm flex items-center space-x-2 disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                  <span>{submitting ? 'Submitting...' : 'Record Transfer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Bulk Asset Transfer</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBulkSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-start space-x-2 p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className={labelClass}>Asset IDs (Comma Separated) *</label>
                <textarea
                  rows={2}
                  required
                  value={bulkAssetIds}
                  onChange={(e) => setBulkAssetIds(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. DVLA-ICT-001, DVLA-ICT-002"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Destination Region *</label>
                  <Select value={form.toRegionId} onValueChange={(val) => updateForm('toRegionId', val)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>
                      {lookups.regions?.map((r: any) => (<SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelClass}>Destination Station *</label>
                  <Select value={form.toStationId} onValueChange={(val) => updateForm('toStationId', val)} disabled={!form.toRegionId}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select station" /></SelectTrigger>
                    <SelectContent>
                      {filteredStations.map((s: any) => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Destination Dept *</label>
                <Select value={form.toDepartmentId} onValueChange={(val) => updateForm('toDepartmentId', val)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select dept" /></SelectTrigger>
                  <SelectContent>
                    {lookups.departments?.map((d: any) => (<SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={form.reason}
                  onChange={(e) => updateForm('reason', e.target.value)}
                  className={inputClass}
                  placeholder="Reason for bulk transfer..."
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm flex items-center space-x-2 disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                  <span>{submitting ? 'Submitting...' : 'Bulk Transfer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
