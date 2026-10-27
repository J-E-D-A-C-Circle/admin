'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Layers, Loader2, MapPin, Plus, RefreshCw, X, AlertCircle, CheckCircle2, Search } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string | null;
}
interface Station {
  id: number;
  name: string;
  code: string;
  location: string | null;
  regionId: number;
  regionName: string;
  departments: Department[];
}
interface Region {
  id: number;
  name: string;
  code: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('ems_token') || localStorage.getItem('dams_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 focus:bg-white transition';

export default function StationsView() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Add-station modal
  const [showStationForm, setShowStationForm] = useState(false);
  const [sName, setSName] = useState('');
  const [sCode, setSCode] = useState('');
  const [sLocation, setSLocation] = useState('');
  const [sRegion, setSRegion] = useState<number | ''>('');
  const [savingStation, setSavingStation] = useState(false);
  const [stationError, setStationError] = useState<string | null>(null);

  // Add-department inline form (one open at a time)
  const [deptFor, setDeptFor] = useState<number | null>(null);
  const [dName, setDName] = useState('');
  const [dCode, setDCode] = useState('');
  const [savingDept, setSavingDept] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ems/stations', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load stations');
      setRegions(data.regions);
      setStations(data.stations);
      setCanManage(!!data.canManage);
    } catch (e: any) {
      setError(e.message || 'Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const submitStation = async (e: React.FormEvent) => {
    e.preventDefault();
    setStationError(null);
    setSavingStation(true);
    try {
      const res = await fetch('/api/ems/stations', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: sName, code: sCode, location: sLocation, regionId: sRegion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not add station');
      setShowStationForm(false);
      setSName('');
      setSCode('');
      setSLocation('');
      setSRegion('');
      flash(`Station "${data.data.name}" added`);
      await load();
    } catch (err: any) {
      setStationError(err.message);
    } finally {
      setSavingStation(false);
    }
  };

  const submitDepartment = async (e: React.FormEvent, stationId: number) => {
    e.preventDefault();
    setDeptError(null);
    setSavingDept(true);
    try {
      const res = await fetch('/api/ems/departments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ stationId, name: dName, code: dCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not add department');
      setDeptFor(null);
      setDName('');
      setDCode('');
      flash(`Department "${data.data.name}" added`);
      await load();
    } catch (err: any) {
      setDeptError(err.message);
    } finally {
      setSavingDept(false);
    }
  };

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = stations.filter(
      (st) =>
        !q ||
        st.name.toLowerCase().includes(q) ||
        st.code.toLowerCase().includes(q) ||
        st.departments.some((d) => d.name.toLowerCase().includes(q))
    );
    const map = new Map<string, Station[]>();
    filtered.forEach((st) => {
      const list = map.get(st.regionName) || [];
      list.push(st);
      map.set(st.regionName, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [stations, search]);

  const totalDepartments = stations.reduce((n, st) => n + st.departments.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-white fintech-card rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-extrabold text-zinc-950">Stations &amp; Departments</h3>
            <p className="text-xs text-zinc-500">
              {stations.length} stations &bull; {totalDepartments} departments across {regions.length} regions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stations or departments"
              className={`${inputCls} pl-8 w-56`}
            />
          </div>
          <button
            type="button"
            onClick={load}
            title="Refresh"
            className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && (
            <button
              id="ems-add-station"
              type="button"
              onClick={() => {
                setStationError(null);
                setShowStationForm(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer active:scale-[0.98] transition"
            >
              <Plus className="w-4 h-4" /> Add Station
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4" /> {notice}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading && stations.length === 0 ? (
        <div className="p-10 flex justify-center bg-white fintech-card rounded-2xl">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="p-10 text-center text-xs text-zinc-500 bg-white fintech-card rounded-2xl">
          No stations match your search.
        </div>
      ) : (
        grouped.map(([regionName, list]) => (
          <section key={regionName} className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600">{regionName}</h4>
              <span className="text-[10px] text-zinc-400">{list.length} stations</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {list.map((st) => (
                <div key={st.id} className="p-4 bg-white fintech-card rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-zinc-950 truncate">{st.name}</div>
                      <div className="text-[11px] text-zinc-500 truncate">{st.location || 'No address set'}</div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20">
                      {st.code}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      <Layers className="w-3 h-3" /> Departments ({st.departments.length})
                    </div>
                    {st.departments.length === 0 ? (
                      <p className="text-[11px] text-zinc-400">No departments yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {st.departments.map((d) => (
                          <span
                            key={d.id}
                            className="px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-medium text-zinc-700"
                          >
                            {d.name}
                            {d.code && <span className="ml-1 text-zinc-400">({d.code})</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {canManage &&
                    (deptFor === st.id ? (
                      <form onSubmit={(e) => submitDepartment(e, st.id)} className="space-y-2 pt-1">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            autoFocus
                            required
                            value={dName}
                            onChange={(e) => setDName(e.target.value)}
                            placeholder="Department name"
                            className={`${inputCls} col-span-2`}
                          />
                          <input
                            value={dCode}
                            onChange={(e) => setDCode(e.target.value)}
                            placeholder="Code (optional)"
                            className={inputCls}
                          />
                        </div>
                        {deptError && <p className="text-[11px] text-rose-600 font-medium">{deptError}</p>}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={savingDept}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-semibold cursor-pointer"
                          >
                            {savingDept ? 'Saving...' : 'Save Department'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeptFor(null);
                              setDeptError(null);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDeptFor(st.id);
                          setDName('');
                          setDCode('');
                          setDeptError(null);
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add department
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Add station modal */}
      {showStationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={submitStation}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-zinc-200 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-zinc-950">Add New Station</h3>
              <button
                type="button"
                onClick={() => setShowStationForm(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Region</label>
              <select
                required
                value={sRegion}
                onChange={(e) => setSRegion(e.target.value ? Number(e.target.value) : '')}
                className={inputCls}
              >
                <option value="">Select region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Station name</label>
                <input
                  required
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  placeholder="e.g. Koforidua Station"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Code</label>
                <input
                  required
                  value={sCode}
                  onChange={(e) => setSCode(e.target.value)}
                  placeholder="KOF-01"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Address / location</label>
              <input
                value={sLocation}
                onChange={(e) => setSLocation(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </div>

            {stationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium">
                {stationError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowStationForm(false)}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingStation}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
              >
                {savingStation ? 'Saving...' : 'Add Station'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
