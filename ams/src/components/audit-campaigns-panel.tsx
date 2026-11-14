'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  QrCode,
  Flag,
} from 'lucide-react';

interface CampaignSummary {
  id: number;
  title: string;
  stationName: string | null;
  categoryName: string | null;
  status: 'Active' | 'Completed';
  startedAt: string;
  completedAt: string | null;
  stats: {
    total: number;
    verified: number;
    missing: number;
    damaged: number;
    pending: number;
  };
}

interface CampaignItem {
  id: number;
  assetId: string;
  assetName: string;
  serialNumber: string;
  subLocation: string | null;
  stationName: string | null;
  status: 'Pending' | 'Verified' | 'Missing' | 'Damaged';
  scannedAt: string | null;
  scannedByName: string | null;
  notes: string | null;
}

export function AuditCampaignsPanel() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [lookups, setLookups] = useState<{ stations?: { id: number; name: string }[]; categories?: { id: number; name: string }[] }>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [stationId, setStationId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Active campaign workspace
  const [activeCampaign, setActiveCampaign] = useState<CampaignSummary | null>(null);
  const [items, setItems] = useState<CampaignItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanStatus, setScanStatus] = useState<'Verified' | 'Missing' | 'Damaged'>('Verified');
  const [scanMessage, setScanMessage] = useState('');
  const [scanning, setScanning] = useState(false);

  const refreshCampaigns = async () => {
    try {
      const [list, lkp] = await Promise.all([api.getAuditCampaigns(), api.getLookups()]);
      setCampaigns(list || []);
      setLookups(lkp || {});
    } catch {
      // ignore transient load error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([api.getAuditCampaigns(), api.getLookups()])
      .then(([list, lkp]) => {
        if (!active) return;
        setCampaigns(list || []);
        setLookups(lkp || {});
      })
      .catch(() => {
        // ignore transient load error
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openCampaign = async (c: CampaignSummary) => {
    setActiveCampaign(c);
    setLoadingItems(true);
    setScanMessage('');
    try {
      const detail = await api.getAuditCampaignDetail(c.id);
      setItems(detail.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.createAuditCampaign({
        title: title.trim(),
        stationId: stationId ? parseInt(stationId, 10) : null,
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
      });
      setTitle('');
      setStationId('');
      setCategoryId('');
      setShowCreate(false);
      await refreshCampaigns();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !scanInput.trim()) return;
    setScanning(true);
    setScanMessage('');

    let assetId = scanInput.trim();
    const match = assetId.match(/\/assets\/([^/?#]+)/i);
    if (match?.[1]) assetId = decodeURIComponent(match[1]);

    try {
      const res = await api.scanAuditCampaignItem(activeCampaign.id, {
        assetId,
        status: scanStatus,
      });
      setScanMessage(res.message || `${assetId} recorded`);
      setScanInput('');
      await Promise.all([openCampaign(activeCampaign), refreshCampaigns()]);
    } catch (err: unknown) {
      setScanMessage(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleCompleteCampaign = async (markRemainingMissing: boolean) => {
    if (!activeCampaign) return;
    try {
      await api.completeAuditCampaign(activeCampaign.id, markRemainingMissing);
      setActiveCampaign(null);
      await refreshCampaigns();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to close campaign');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Flag className="w-4 h-4 text-amber-400" />
            <span>Physical Audit Campaigns (Cycle-Count)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Run targeted station or category audits and check off assets continuously by Asset ID or QR scan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Audit Campaign</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-6 flex items-center justify-center text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin mr-2 text-amber-500" />
          Loading audit campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
          No physical audit campaigns yet. Create one to begin a station cycle count.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaigns.map((c) => {
            const done = c.stats.verified + c.stats.missing + c.stats.damaged;
            const pct = c.stats.total > 0 ? Math.round((done / c.stats.total) * 100) : 0;
            return (
              <div
                key={c.id}
                onClick={() => void openCampaign(c)}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-colors space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{c.title}</h3>
                    <p className="text-[11px] text-slate-400">
                      {c.stationName || 'All Stations'} • {c.categoryName || 'All Categories'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.status === 'Active'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>
                      {done} / {c.stats.total} checked
                    </span>
                    <span className="font-mono text-amber-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                  <span className="text-emerald-400">{c.stats.verified} Verified</span>
                  <span className="text-amber-400">{c.stats.pending} Pending</span>
                  {c.stats.missing > 0 && <span className="text-red-400">{c.stats.missing} Missing</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Start Physical Audit Campaign</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 uppercase mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 2026 Accra Main IT Audit"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-400 uppercase mb-1">Station Scope (Optional)</label>
                <select
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                >
                  <option value="">All Stations</option>
                  {lookups.stations?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-400 uppercase mb-1">Category Scope (Optional)</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                >
                  <option value="">All Categories</option>
                  {lookups.categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3.5 py-2 bg-slate-800 text-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-3.5 py-2 bg-amber-500 text-slate-950 rounded-lg font-bold flex items-center space-x-1"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Launch Campaign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Campaign Workspace Modal */}
      {activeCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <ClipboardCheck className="w-4 h-4 text-amber-400" />
                  <span>{activeCampaign.title}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {activeCampaign.stationName || 'All Stations'} • {activeCampaign.categoryName || 'All Categories'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCampaign(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeCampaign.status === 'Active' && (
              <form onSubmit={handleScanSubmit} className="p-4 border-b border-slate-800 bg-slate-950/50 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <QrCode className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      placeholder="Scan QR / type Asset ID (e.g. DVLA-IT-000001) and press Enter"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <select
                    value={scanStatus}
                    onChange={(e) => setScanStatus(e.target.value as 'Verified' | 'Missing' | 'Damaged')}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Missing">Missing</option>
                  </select>
                  <button
                    type="submit"
                    disabled={scanning}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    {scanning ? 'Saving...' : 'Check Off'}
                  </button>
                </div>
                {scanMessage && <p className="text-[11px] text-amber-400">{scanMessage}</p>}
              </form>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {loadingItems ? (
                <div className="py-10 flex items-center justify-center text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-amber-500" />
                  Loading campaign checklist...
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-2">Asset ID</th>
                      <th className="py-2 px-2">Asset Name</th>
                      <th className="py-2 px-2">Location</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-2 font-mono text-amber-400">{item.assetId}</td>
                        <td className="py-2 px-2 text-slate-200">{item.assetName}</td>
                        <td className="py-2 px-2 text-slate-400">
                          {item.stationName || '—'}
                          {item.subLocation ? ` (${item.subLocation})` : ''}
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Verified'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : item.status === 'Missing'
                                ? 'bg-red-500/15 text-red-400'
                                : item.status === 'Damaged'
                                ? 'bg-orange-500/15 text-orange-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.status === 'Verified' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : item.status !== 'Pending' ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : null}
                            <span>{item.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {activeCampaign.status === 'Active' && (
              <div className="p-4 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2 bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => void handleCompleteCampaign(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                >
                  Close Campaign
                </button>
                <button
                  type="button"
                  onClick={() => void handleCompleteCampaign(true)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
                >
                  Close &amp; Mark Pending as Missing
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
