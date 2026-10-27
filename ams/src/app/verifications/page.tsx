'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import {
  Search, ClipboardCheck, Loader2, AlertCircle, CheckCircle2,
  X, ChevronLeft, ChevronRight, ShieldCheck, AlertTriangle, Skull,
  History, QrCode, MapPin, Layers, HeartCrack, ShieldAlert, BadgeCheck,
  Camera, Image as ImageIcon
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

type Verification = {
  id: number;
  assetId: string;
  assetName: string;
  station: string;
  region: string;
  verificationDate: string;
  verificationType: string;
  status: string;
  verifiedBy: string;
  comments?: string;
  photoUrl?: string;
  latitude?: string;
  longitude?: string;
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
  Verified: {
    label: 'Verified',
    icon: <BadgeCheck className="w-3.5 h-3.5" />,
    class: 'text-emerald-400 bg-emerald-950/50 border-emerald-900/50',
  },
  Missing: {
    label: 'Missing',
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
    class: 'text-amber-400 bg-amber-950/50 border-amber-900/50',
  },
  Damaged: {
    label: 'Damaged',
    icon: <HeartCrack className="w-3.5 h-3.5" />,
    class: 'text-red-400 bg-red-950/50 border-red-900/50',
  },
};

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, missing: 0, damaged: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals & Drawers
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // History Drawer State
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyAsset, setHistoryAsset] = useState<{id: string, name: string} | null>(null);

  const [lookups, setLookups] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [userStationId, setUserStationId] = useState<number | null>(null);

  const limit = 15;

  // Single Verify Form
  const [form, setForm] = useState({
    assetId: '',
    verificationType: 'Quarterly',
    status: 'Verified',
    comments: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Bulk Verify Form
  const [bulkForm, setBulkForm] = useState({
    verificationType: 'Quarterly',
    status: 'Verified',
    comments: '',
  });

  // Autocomplete & Station states for Single Verify
  const [selectedStationId, setSelectedStationId] = useState('');
  const [assetSearch, setAssetSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchingAssets, setSearchingAssets] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Discrepancy warning
  const discrepancy = selectedAsset && selectedStationId && String(selectedAsset.stationId) !== selectedStationId;

  useEffect(() => {
    fetchStats();
    api.getLookups().then(setLookups).catch(console.error);
    const u = localStorage.getItem('dams_user');
    if (u) {
      const p = JSON.parse(u);
      setUserRole(p.role);
      setUserStationId(p.stationId);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    if (assetSearch.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (selectedAsset && assetSearch === selectedAsset.assetId) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchingAssets(true);
      try {
        const queryParams: any = { search: assetSearch, limit: 10 };
        if (selectedStationId) queryParams.stationId = selectedStationId;
        const res = await api.getAssets(queryParams);
        setSuggestions(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingAssets(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [assetSearch, selectedStationId, selectedAsset]);

  const fetchStats = async () => {
    try {
      const data = await api.getVerificationStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit, search };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.verificationType = typeFilter;
      const data = await api.getVerifications(params);
      setVerifications(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = (): Promise<{latitude: string, longitude: string} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }),
          () => resolve(null), // if denied or error, resolve null
          { timeout: 5000 }
        );
      }
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm({ assetId: '', verificationType: 'Quarterly', status: 'Verified', comments: '' });
    setPhotoFile(null);
    setPhotoPreview(null);
    setSelectedStationId('');
    setAssetSearch('');
    setSuggestions([]);
    setSelectedAsset(null);
    setShowSuggestions(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      let uploadedPhotoUrl = null;
      if (photoFile) {
        const uploadRes = await api.uploadFile(photoFile);
        uploadedPhotoUrl = uploadRes.url;
      }

      const location = await getLocation();
      await api.createVerification({
        assetId: form.assetId,
        verificationType: form.verificationType,
        status: form.status,
        comments: form.comments || null,
        photoUrl: uploadedPhotoUrl,
        latitude: location?.latitude,
        longitude: location?.longitude,
        verifiedAtStationId: selectedStationId ? parseInt(selectedStationId) : undefined,
      });
      setSuccessMsg('Verification recorded successfully.');
      handleCloseModal();
      fetchVerifications();
      fetchStats();
    } catch (err: any) {
      setError(err.message || 'Failed to record verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const location = await getLocation();
      await api.bulkCreateVerifications({
        assetIds: selectedIds,
        verificationType: bulkForm.verificationType,
        status: bulkForm.status,
        comments: bulkForm.comments || null,
        latitude: location?.latitude,
        longitude: location?.longitude,
        verifiedAtStationId: userStationId || undefined,
      });
      setSuccessMsg(`Bulk verification recorded for ${selectedIds.length} assets.`);
      setShowBulkModal(false);
      setSelectedIds([]);
      fetchVerifications();
      fetchStats();
    } catch (err: any) {
      setError(err.message || 'Failed to record bulk verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInlineAction = async (assetId: string, status: string) => {
    try {
      const location = await getLocation();
      await api.createVerification({
        assetId,
        verificationType: 'Quarterly', // Default inline type
        status,
        latitude: location?.latitude,
        longitude: location?.longitude,
        verifiedAtStationId: userStationId || undefined,
      });
      setSuccessMsg(`Asset ${assetId} verified as ${status}`);
      fetchVerifications();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to verify');
    }
  };

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(verifications.map(v => v.assetId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (assetId: string) => {
    if (selectedIds.includes(assetId)) {
      setSelectedIds(selectedIds.filter(id => id !== assetId));
    } else {
      setSelectedIds([...selectedIds, assetId]);
    }
  };

  const openHistory = async (assetId: string, assetName: string) => {
    setHistoryAsset({ id: assetId, name: assetName });
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const h = await api.getAssetHistory(assetId);
      setHistoryLogs(h);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const canVerify = userRole === 'Super Admin' || userRole === 'Asset Officer';

  const inputClass = 'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-200 text-sm placeholder-slate-600 focus:outline-none';
  const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Verifications</h1>
          <p className="text-sm text-slate-400">Track and record asset verification exercises</p>
        </div>
        {canVerify && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-sm border border-slate-700"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-sm"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Verify Asset</span>
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Logs</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-emerald-400/80 text-xs font-semibold uppercase tracking-wider mb-1">Verified</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.verified}</div>
        </div>
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-amber-400/80 text-xs font-semibold uppercase tracking-wider mb-1">Missing</div>
          <div className="text-2xl font-bold text-amber-400">{stats.missing}</div>
        </div>
        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-red-400/80 text-xs font-semibold uppercase tracking-wider mb-1">Damaged</div>
          <div className="text-2xl font-bold text-red-400">{stats.damaged}</div>
        </div>
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

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search assets..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
            <SelectTrigger className="w-full md:w-36 bg-slate-900 border-slate-800 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Verified">Verified</SelectItem>
              <SelectItem value="Missing">Missing</SelectItem>
              <SelectItem value="Damaged">Damaged</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
            <SelectTrigger className="w-full md:w-36 bg-slate-900 border-slate-800 h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
              <SelectItem value="Half_Yearly">Half Yearly</SelectItem>
              <SelectItem value="Annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.length > 0 && canVerify && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-500">{selectedIds.length} selected</span>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2"
            >
              <Layers className="w-3.5 h-3.5" />
              Bulk Action
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table & Mobile Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Mobile View */}
        <div className="md:hidden space-y-3 px-2 py-3">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : verifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No verifications found.</div>
          ) : (
            verifications.map((v) => {
              const sc = statusConfig[v.status] || statusConfig.Verified;
              return (
                <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2.5 gap-2">
                      <div className="flex space-x-3 items-start flex-1 min-w-0">
                        {canVerify && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(v.assetId)}
                            onChange={() => handleToggleSelect(v.assetId)}
                            className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-slate-200 text-sm font-semibold truncate leading-tight">{v.assetName}</h3>
                          <p className="font-mono text-[10px] text-amber-400 mt-0.5">{v.assetId}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold flex-shrink-0 ${sc.class}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>

                    <div className="bg-slate-950/30 rounded-lg p-2.5 grid grid-cols-2 gap-y-2 gap-x-2 text-xs mb-1">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Location</span>
                        <span className="font-medium text-slate-300 block truncate">{v.station}</span>
                        {v.latitude && v.longitude && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`} target="_blank" rel="noreferrer" className="block text-amber-500 hover:underline mt-0.5 text-[10px]">
                            <MapPin className="inline w-3 h-3 mr-0.5" /> GPS
                          </a>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Type</span>
                        <span className="font-medium text-slate-300 block truncate">{v.verificationType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 px-3 py-2.5 flex items-center justify-between bg-slate-900 mt-auto">
                    <div className="text-[10px] text-slate-400 flex flex-col">
                      <span>{new Date(v.verificationDate).toLocaleDateString()}</span>
                      <span>By: {v.verifiedBy}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button onClick={() => openHistory(v.assetId, v.assetName)} className="p-1.5 text-slate-400 hover:text-white rounded-md bg-slate-800/50 border border-slate-700/50">
                        <History className="w-3.5 h-3.5" />
                      </button>
                      {canVerify && (
                         <>
                           <button onClick={() => handleInlineAction(v.assetId, 'Verified')} className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-md bg-emerald-950/30 border border-emerald-900/30"><BadgeCheck className="w-3.5 h-3.5" /></button>
                           <button onClick={() => handleInlineAction(v.assetId, 'Missing')} className="p-1.5 text-amber-400 hover:text-amber-300 rounded-md bg-amber-950/30 border border-amber-900/30"><ShieldAlert className="w-3.5 h-3.5" /></button>
                         </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {canVerify && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={verifications.length > 0 && selectedIds.length === verifications.length}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified By</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canVerify ? 8 : 7} className="px-4 py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan={canVerify ? 8 : 7} className="px-4 py-16 text-center text-slate-500">
                    No verifications found.
                  </td>
                </tr>
              ) : (
                verifications.map((v) => {
                  const sc = statusConfig[v.status] || statusConfig.Verified;
                  return (
                    <tr key={v.id} className="border-t border-slate-800/60 hover:bg-slate-800/30">
                      {canVerify && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(v.assetId)}
                            onChange={() => handleToggleSelect(v.assetId)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-amber-400 font-medium mb-0.5">{v.assetId}</div>
                        <div className="text-slate-200 text-sm font-medium truncate max-w-[180px]">{v.assetName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-200">{v.station}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          {v.region}
                          {v.latitude && v.longitude && (
                            <a href={`https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline" title={`Lat: ${v.latitude}, Lng: ${v.longitude}`}>
                              <MapPin className="inline w-3 h-3 mr-0.5" /> GPS
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">{v.verificationType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium ${sc.class}`}>
                          {sc.icon} {sc.label}
                        </span>
                        {v.photoUrl && <a href={v.photoUrl} target="_blank" rel="noreferrer" className="inline-block ml-2 text-slate-400 hover:text-amber-400" title="View attached photo"><ImageIcon className="w-3.5 h-3.5" /></a>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {new Date(v.verificationDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{v.verifiedBy}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openHistory(v.assetId, v.assetName)} title="History" className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
                            <History className="w-4 h-4" />
                          </button>
                          {canVerify && (
                            <>
                              <button onClick={() => handleInlineAction(v.assetId, 'Verified')} title="Mark Verified" className="p-1.5 text-emerald-400 hover:bg-emerald-950/50 rounded"><BadgeCheck className="w-4 h-4" /></button>
                              <button onClick={() => handleInlineAction(v.assetId, 'Missing')} title="Mark Missing" className="p-1.5 text-amber-400 hover:bg-amber-950/50 rounded"><ShieldAlert className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-slate-800 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center space-x-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single Verify Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
              <h2 className="text-lg font-bold text-white">Record Verification</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 shrink-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start space-x-2 p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label className={labelClass}>Current Station (Where are you?) *</label>
                <Select value={selectedStationId} onValueChange={(val) => { setSelectedStationId(val); setAssetSearch(''); setForm(p => ({...p, assetId: ''})); setSelectedAsset(null); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {lookups.stations?.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <label className={labelClass}>Asset *</label>
                <input
                  type="text" required value={assetSearch}
                  onChange={(e) => {
                    setAssetSearch(e.target.value);
                    setShowSuggestions(true);
                    if (selectedAsset && e.target.value !== selectedAsset.assetId) {
                      setSelectedAsset(null);
                      setForm(p => ({ ...p, assetId: '' }));
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className={inputClass} placeholder="Type ID, Chassis..."
                />
                {showSuggestions && assetSearch.trim().length >= 2 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg shadow-xl divide-y divide-slate-800">
                    {searchingAssets ? (
                      <div className="px-3 py-2 text-xs text-slate-500 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Searching...</div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500 italic">No match</div>
                    ) : (
                      suggestions.map((asset) => (
                        <button
                          key={asset.assetId} type="button"
                          onMouseDown={() => {
                            setSelectedAsset(asset);
                            setForm(p => ({ ...p, assetId: asset.assetId }));
                            setAssetSearch(asset.assetId);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-900 flex flex-col"
                        >
                          <span className="font-mono text-xs text-amber-500">{asset.assetId}</span>
                          <span className="text-xs text-slate-200 truncate">{asset.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {discrepancy && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex gap-2">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-200">
                    <span className="font-bold text-red-400">Location Discrepancy!</span><br/>
                    This asset is registered at <b>{selectedAsset.stationName}</b>, but you are verifying it at a different station. This discrepancy will be logged.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type *</label>
                  <Select value={form.verificationType} onValueChange={(val) => setForm((p) => ({ ...p, verificationType: val }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Half_Yearly">Half Yearly</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelClass}>Status *</label>
                  <Select value={form.status} onValueChange={(val) => setForm((p) => ({ ...p, status: val }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verified">Verified</SelectItem>
                      <SelectItem value="Missing">Missing</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Comments</label>
                <textarea rows={3} value={form.comments} onChange={(e) => setForm((p) => ({ ...p, comments: e.target.value }))} className={inputClass} />
              </div>
              
              <div>
                <label className={labelClass}>Condition Photo (Optional)</label>
                <div className="flex items-center gap-4">
                  {photoPreview && (
                    <div className="relative w-16 h-16 rounded border border-slate-700 overflow-hidden shrink-0 bg-black">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-0 right-0 p-0.5 bg-black/60 text-white hover:text-red-400"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-sm cursor-pointer transition-colors w-full">
                    <Camera className="w-4 h-4" />
                    <span>{photoFile ? 'Change Photo' : 'Take / Upload Photo'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotoFile(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm flex items-center space-x-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  <span>{submitting ? 'Recording...' : 'Record with GPS'}</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Verify Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl p-5 space-y-4">
             <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Bulk Verification</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-300">You are about to verify <b>{selectedIds.length}</b> assets. This action will log your current GPS location.</p>
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type *</label>
                  <Select value={bulkForm.verificationType} onValueChange={(val) => setBulkForm((p) => ({ ...p, verificationType: val }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Half_Yearly">Half Yearly</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelClass}>Status *</label>
                  <Select value={bulkForm.status} onValueChange={(val) => setBulkForm((p) => ({ ...p, status: val }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verified">Verified</SelectItem>
                      <SelectItem value="Missing">Missing</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm flex items-center space-x-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  <span>{submitting ? 'Applying...' : 'Apply Bulk Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal Component */}
      {showScanner && (
        <ScannerModal onClose={() => setShowScanner(false)} onScan={(id) => {
          setShowScanner(false);
          setAssetSearch(id);
          setForm(p => ({...p, assetId: id}));
          setShowModal(true);
        }} />
      )}

      {/* History Drawer */}
      {showHistory && (
         <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
           <div className="bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-700 animate-in slide-in-from-right duration-200">
             <div className="p-4 border-b border-slate-800 flex items-center justify-between">
               <div>
                 <h2 className="text-lg font-bold text-white">Verification History</h2>
                 <p className="text-xs text-amber-500 font-mono">{historyAsset?.id}</p>
               </div>
               <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full"><X className="w-5 h-5"/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {historyLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
                ) : historyLogs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center">No history logs found.</p>
                ) : (
                  <div className="relative border-l border-slate-700 ml-3 space-y-6">
                    {historyLogs.map((log: any) => (
                      <div key={log.id} className="relative pl-6">
                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-slate-900"></div>
                        <div className="text-xs text-slate-400 mb-1">{new Date(log.createdAt).toLocaleString()}</div>
                        <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50 text-sm text-slate-300">
                          <span className="font-semibold text-amber-400 block mb-1">{log.actionType}</span>
                          {log.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           </div>
         </div>
      )}

    </div>
  );
}

// Scanner Component extracted to manage Html5Qrcode lifecycle safely
function ScannerModal({ onClose, onScan }: { onClose: () => void; onScan: (text: string) => void }) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode;
    let isStopped = false;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader", {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (!isStopped) {
              isStopped = true;
              html5QrCode.stop().then(() => {
                onScan(decodedText);
              }).catch(console.error);
            }
          },
          (err) => {
            // Ignored, frame without QR
          }
        );
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Failed to start camera. Please ensure permissions are granted.");
      }
    };

    startScanner();

    return () => {
      isStopped = true;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4">
       <div className="w-full max-w-sm bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
         <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white">Scan QR Code</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
         </div>
         <div className="p-0 bg-black relative w-full h-[300px] flex items-center justify-center overflow-hidden">
            {errorMsg ? (
              <div className="text-red-400 text-sm p-4 text-center">{errorMsg}</div>
            ) : (
              <div id="qr-reader" className="w-full h-full object-cover"></div>
            )}
         </div>
         <div className="p-4 text-center text-sm text-slate-400">
           Position the QR code within the frame to verify automatically.
         </div>
       </div>
    </div>
  );
}
