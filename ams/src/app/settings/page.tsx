'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  User,
  Users,
  Settings,
  ShieldCheck,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type UserProfile = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  region: string | null;
  station: string | null;
  createdAt: string;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [lookups, setLookups] = useState<any>({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register user form
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    roleId: '',
    regionId: '',
    stationId: '',
  });

  const [filteredStations, setFilteredStations] = useState<any[]>([]);

  useEffect(() => {
    // Get logged-in user profile from client-side stored payload or local storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dams_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }

    api.getLookups().then(setLookups).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && (currentUser?.role === 'Super Admin' || currentUser?.role === 'Super_Admin')) {
      fetchUsers();
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (form.regionId && lookups.stations) {
      setFilteredStations(lookups.stations.filter((s: any) => s.regionId === parseInt(form.regionId)));
      setForm((p) => ({ ...p, stationId: '' }));
    } else {
      setFilteredStations([]);
    }
  }, [form.regionId, lookups.stations]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.getUsers();
      setUsersList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      await api.registerUser({
        username: form.username,
        password: form.password,
        name: form.name,
        email: form.email,
        roleId: parseInt(form.roleId),
        regionId: form.regionId ? parseInt(form.regionId) : null,
        stationId: form.stationId ? parseInt(form.stationId) : null,
      });

      setSuccessMsg('User registered successfully.');
      setForm({
        username: '',
        password: '',
        name: '',
        email: '',
        roleId: '',
        regionId: '',
        stationId: '',
      });
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register user.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Super_Admin';

  const inputClass =
    'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-200 text-sm placeholder-slate-600 focus:outline-none';
  const selectClass =
    'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-300 text-sm focus:outline-none';
  const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-slate-400">Manage your profile, system settings, and user permissions</p>
      </div>

      <div className="flex border-b border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <User className="w-4 h-4" />
            My Profile
          </span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </span>
          </button>
        )}
      </div>

      {activeTab === 'profile' && currentUser && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white mb-4">Account Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-slate-500 uppercase font-semibold">Name</span>
                  <span className="text-sm font-medium text-slate-200">{currentUser.name}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase font-semibold">Username</span>
                  <span className="text-sm font-medium text-slate-200">{currentUser.username}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase font-semibold">Email</span>
                  <span className="text-sm font-medium text-slate-200">{currentUser.email || '—'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase font-semibold">Role</span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                    {currentUser.role}
                  </span>
                </div>
                {currentUser.region && (
                  <div>
                    <span className="block text-xs text-slate-500 uppercase font-semibold">Assigned Region</span>
                    <span className="text-sm font-medium text-slate-200">{currentUser.region}</span>
                  </div>
                )}
                {currentUser.station && (
                  <div>
                    <span className="block text-xs text-slate-500 uppercase font-semibold">Assigned Station</span>
                    <span className="text-sm font-medium text-slate-200">{currentUser.station}</span>
                  </div>
                )}
              </div>
            </div>

            {isSuperAdmin && (
              <div className="border-t border-slate-800 pt-6 space-y-3">
                <h3 className="text-sm font-semibold text-white">System Data Settings</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Manage drop-down lists used in asset forms (Regions, Stations, Departments, Categories, and Subcategories).
                </p>
                <Link
                  href="/settings/lookups"
                  className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                >
                  Configure Dropdown Options &rarr;
                </Link>
              </div>
            )}
          </div>


          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-white mb-2">Security Rules</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your account is bound to system RBAC policy. Only Super Admins can manage other user accounts and assign administrative scopes (Region/Station filters).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-800 pt-4">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Security enforced via JWT signatures.</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Registration Form */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 h-fit">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <UserPlus className="w-5 h-5 text-amber-500" />
              <span>Register New User</span>
            </div>

            {errorMsg && (
              <div className="flex items-start space-x-2 p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center space-x-2 p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-200 rounded-lg text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={labelClass}>Username *</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Role *</label>
                <Select
                  value={form.roleId}
                  onValueChange={(val) => setForm((p) => ({ ...p, roleId: val }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {lookups.roles?.map((r: any) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={labelClass}>Scope Region</label>
                <Select
                  value={form.regionId || 'national'}
                  onValueChange={(val) => setForm((p) => ({ ...p, regionId: val === 'national' ? '' : val, stationId: '' }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Regions (National Scope)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">All Regions (National Scope)</SelectItem>
                    {lookups.regions?.map((r: any) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={labelClass}>Scope Station</label>
                <Select
                  value={form.stationId || 'all_stations'}
                  onValueChange={(val) => setForm((p) => ({ ...p, stationId: val === 'all_stations' ? '' : val }))}
                  disabled={!form.regionId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Stations in Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_stations">All Stations in Region</SelectItem>
                    {filteredStations.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-sm flex items-center justify-center space-x-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Registering...' : 'Register User'}</span>
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-800 font-bold text-white text-sm">
              Registered Users
            </div>
            {loadingUsers ? (
              <div className="p-10 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60">
                      <th className="px-4 py-3 text-left font-semibold text-slate-400">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-400">Role</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-400">Region / Station</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-400">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((user) => (
                      <tr key={user.id} className="border-t border-slate-800/60 hover:bg-slate-850">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-200">{user.name}</div>
                          <div className="text-slate-500 font-mono text-[10px]">{user.username}</div>
                        </td>
                        <td className="px-4 py-3 text-amber-400 font-medium">{user.role}</td>
                        <td className="px-4 py-3 text-slate-350">
                          {user.station || user.region || <span className="text-slate-550 italic">National Scope</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{user.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
