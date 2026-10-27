'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Shield,
  Building2,
  Mail,
  Lock,
  UserCheck,
} from 'lucide-react';

interface UserItem {
  id: number;
  username: string;
  email: string;
  name: string;
  roleId: number;
  roleName: string;
  regionId: number | null;
  regionName: string;
  stationId: number | null;
  stationName: string;
  status: string;
  createdAt: string;
}

interface RoleItem {
  id: number;
  name: string;
  description: string;
}

interface StationItem {
  id: number;
  name: string;
  code: string;
  regionId: number;
}

interface RegionItem {
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

export default function UsersView() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [stations, setStations] = useState<StationItem[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Add User Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [regionId, setRegionId] = useState<number | ''>('');
  const [stationId, setStationId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load user accounts');
      setUsers(data.users || []);
      setRoles(data.roles || []);
      setStations(data.stations || []);
      setRegions(data.regions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const handleStationChange = (stId: number | '') => {
    setStationId(stId);
    if (stId !== '') {
      const st = stations.find((s) => s.id === Number(stId));
      if (st && st.regionId) {
        setRegionId(st.regionId);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          roleId: Number(roleId),
          regionId: regionId !== '' ? Number(regionId) : null,
          stationId: stationId !== '' ? Number(stationId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to create user account');

      setShowModal(false);
      setName('');
      setUsername('');
      setEmail('');
      setPassword('password123');
      setRoleId('');
      setRegionId('');
      setStationId('');
      flash(`User account for "${name}" created successfully.`);
      await loadData();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.roleName && u.roleName.toLowerCase().includes(q)) ||
        (u.stationName && u.stationName.toLowerCase().includes(q))
    );
  }, [users, search]);

  const roleLabel = (roleName?: string) => {
    if (!roleName) return 'User';
    if (roleName === 'Super_Admin') return 'Super Admin';
    if (roleName === 'EMS_Director') return 'Director, Administration';
    if (roleName === 'EMS_Manager') return 'Station Manager';
    if (roleName === 'EMS_Admin_Officer') return 'Admin Officer';
    if (roleName === 'EMS_Finance_Audit') return 'Finance / Audit';
    return roleName.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="p-4 bg-white fintech-card rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-extrabold text-zinc-950">User Account Management</h3>
            <p className="text-xs text-zinc-500">
              Create and manage official staff accounts across all DVLA stations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff, username, role..."
              className={`${inputCls} pl-8 w-60`}
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            title="Refresh Users"
            className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer active:scale-[0.98] transition shadow-xs"
          >
            <UserPlus className="w-4 h-4" /> Add User Account
          </button>
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

      {/* Users Table */}
      <div className="bg-white fintech-card rounded-2xl overflow-hidden border border-zinc-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Station / Office</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Loading staff directory...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-950">{u.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        @{u.username} &bull; {u.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20">
                        <Shield className="w-2.5 h-2.5" />
                        {roleLabel(u.roleName)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-700 font-medium">
                      {u.stationName}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 text-[11px]">
                      {u.regionName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateUser}
            className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-zinc-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950">Add Staff Account</h3>
                  <p className="text-[11px] text-zinc-500">Authorize a new DVLA staff member on EMS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Samuel Osei Mensah"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Username</label>
                <input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. sosei_admin"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Work Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. samuel.mensah@dvla.gov.gh"
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Temporary Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">System Role</label>
                <select
                  required
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : '')}
                  className={inputCls}
                >
                  <option value="">Select assigned role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {roleLabel(r.name)} &mdash; {r.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Station / Office</label>
                <select
                  value={stationId}
                  onChange={(e) => handleStationChange(e.target.value ? Number(e.target.value) : '')}
                  className={inputCls}
                >
                  <option value="">National HQ / All Stations</option>
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Region</label>
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : '')}
                  className={inputCls}
                >
                  <option value="">National / All Regions</option>
                  {regions.map((rg) => (
                    <option key={rg.id} value={rg.id}>
                      {rg.name} ({rg.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer transition shadow-xs"
              >
                {saving ? 'Creating...' : 'Create Staff Account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
