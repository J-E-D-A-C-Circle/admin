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
  KeyRound,
  Trash2,
  X,
  Pencil,
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
  roleId?: number;
  roleName?: string;
  role?: string;
  regionId?: number | null;
  regionName?: string | null;
  region?: string | null;
  stationId?: number | null;
  stationName?: string | null;
  station?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
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

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Edit user modal state
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    roleId: '',
    regionId: '',
    stationId: '',
    password: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Self-service password change state
  const [selfPwForm, setSelfPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingSelfPw, setSavingSelfPw] = useState(false);

  // Confirm delete user modal state
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

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

            {/* Self-Service Password Change */}
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Change My Password</h3>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErrorMsg('');
                  setSuccessMsg('');
                  if (selfPwForm.newPassword.length < 8) {
                    setErrorMsg('New password must be at least 8 characters and include a letter and number.');
                    return;
                  }
                  if (selfPwForm.newPassword !== selfPwForm.confirmPassword) {
                    setErrorMsg('New passwords do not match.');
                    return;
                  }
                  setSavingSelfPw(true);
                  try {
                    const res = await api.changeOwnPassword({
                      currentPassword: selfPwForm.currentPassword,
                      newPassword: selfPwForm.newPassword,
                    });
                    setSuccessMsg(res.message);
                    setSelfPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Failed to update password');
                  } finally {
                    setSavingSelfPw(false);
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={selfPwForm.currentPassword}
                    onChange={(e) => setSelfPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={selfPwForm.newPassword}
                    onChange={(e) => setSelfPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="8+ chars, letter & number"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Confirm</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={selfPwForm.confirmPassword}
                      onChange={(e) => setSelfPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingSelfPw}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg disabled:opacity-50 self-end whitespace-nowrap"
                  >
                    {savingSelfPw ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
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
                      <th className="px-4 py-3 text-left font-semibold text-slate-400">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-400">Region / Station</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-400">Email</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((user) => (
                      <tr key={user.id} className="border-t border-slate-800/60 hover:bg-slate-850">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-200">{user.name}</div>
                          <div className="text-slate-500 font-mono text-[10px]">{user.username}</div>
                        </td>
                        <td className="px-4 py-3 text-amber-400 font-medium">{user.roleName || user.role}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              user.isActive === false
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {user.isActive === false ? 'Disabled' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-350">
                          {user.stationName || user.station || user.regionName || user.region || <span className="text-slate-550 italic">National Scope</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{user.email}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditTarget(user);
                                setEditForm({
                                  name: user.name || '',
                                  username: user.username || '',
                                  email: user.email || '',
                                  roleId: user.roleId ? String(user.roleId) : '',
                                  regionId: user.regionId ? String(user.regionId) : '',
                                  stationId: user.stationId ? String(user.stationId) : '',
                                  password: '',
                                });
                                setErrorMsg('');
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/30 text-[11px] font-semibold transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetTarget(user);
                                setNewPassword('');
                                setConfirmPassword('');
                                setErrorMsg('');
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-[11px] font-semibold transition-colors"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Reset Password</span>
                            </button>
                            {currentUser?.id !== user.id && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    setErrorMsg('');
                                    const nextActive = user.isActive === false;
                                    const res = await api.updateUser(user.id, { isActive: nextActive });
                                    setSuccessMsg(res.message);
                                    const updated = await api.getUsers();
                                    setUsersList(updated);
                                  } catch (err: any) {
                                    setErrorMsg(err.message || 'Failed to update status');
                                  }
                                }}
                                className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                                  user.isActive === false
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950'
                                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-amber-500/20 hover:text-amber-300'
                                }`}
                              >
                                {user.isActive === false ? 'Enable' : 'Disable'}
                              </button>
                            )}
                            {currentUser?.id !== user.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setErrorMsg('');
                                  setDeleteTarget(user);
                                }}
                                title="Delete User"
                                className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Password Reset Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Reset User Password</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {resetTarget.name} (<span className="font-mono">{resetTarget.username}</span>)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErrorMsg('');
                if (newPassword.length < 6) {
                  setErrorMsg('Password must be at least 6 characters.');
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setErrorMsg('Passwords do not match.');
                  return;
                }
                setResetting(true);
                try {
                  const res = await api.updateUser(resetTarget.id, { password: newPassword });
                  setSuccessMsg(res.message);
                  setResetTarget(null);
                  setNewPassword('');
                  setConfirmPassword('');
                } catch (err: any) {
                  setErrorMsg(err.message || 'Failed to reset password');
                } finally {
                  setResetting(false);
                }
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 text-sm focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Pencil className="w-4 h-4 text-sky-400" />
                  <span>Edit User Account</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update profile, role, scope, or password for <span className="font-mono">{editTarget.username}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErrorMsg('');
                if (editForm.password && editForm.password.length < 6) {
                  setErrorMsg('New password must be at least 6 characters.');
                  return;
                }
                setSavingEdit(true);
                try {
                  const payload: any = {
                    name: editForm.name.trim(),
                    username: editForm.username.trim(),
                    email: editForm.email.trim(),
                    regionId: editForm.regionId ? parseInt(editForm.regionId, 10) : null,
                    stationId: editForm.stationId ? parseInt(editForm.stationId, 10) : null,
                  };
                  if (editForm.roleId) payload.roleId = parseInt(editForm.roleId, 10);
                  if (editForm.password) payload.password = editForm.password;

                  const res = await api.updateUser(editTarget.id, payload);
                  setSuccessMsg(res.message);
                  setEditTarget(null);
                  const updated = await api.getUsers();
                  setUsersList(updated);
                } catch (err: any) {
                  setErrorMsg(err.message || 'Failed to update user account');
                } finally {
                  setSavingEdit(false);
                }
              }}
              className="p-5 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg text-slate-200 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={editForm.username}
                    onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg text-slate-200 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg text-slate-200 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Role *
                  </label>
                  <Select
                    value={editForm.roleId}
                    onValueChange={(val) => setEditForm((p) => ({ ...p, roleId: val }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookups.roles?.map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Region (Optional)
                  </label>
                  <Select
                    value={editForm.regionId || 'none'}
                    onValueChange={(val) =>
                      setEditForm((p) => ({
                        ...p,
                        regionId: val === 'none' ? '' : val,
                        stationId: '',
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="National Scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">National Scope</SelectItem>
                      {lookups.regions?.map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Station (Optional)
                  </label>
                  <Select
                    value={editForm.stationId || 'none'}
                    onValueChange={(val) =>
                      setEditForm((p) => ({ ...p, stationId: val === 'none' ? '' : val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Stations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Stations</SelectItem>
                      {lookups.stations
                        ?.filter((s: any) => !editForm.regionId || String(s.regionId) === editForm.regionId)
                        .map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  New Password (Optional — leave blank to keep current)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={editForm.password}
                  onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Enter new password only if changing"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg text-slate-200 text-sm focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  {savingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete User Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete User Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-300">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-white">{deleteTarget.name}</span>{' '}
                (<span className="font-mono text-amber-400">{deleteTarget.username}</span>)?
                If this user has historical audit/transfer records, disable the account instead.
              </p>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingUser}
                  onClick={async () => {
                    setDeletingUser(true);
                    setErrorMsg('');
                    try {
                      const res = await api.deleteUser(deleteTarget.id);
                      setSuccessMsg(res.message);
                      setDeleteTarget(null);
                      const updated = await api.getUsers();
                      setUsersList(updated);
                    } catch (err: any) {
                      setErrorMsg(err.message || 'Failed to delete user');
                      setDeleteTarget(null);
                    } finally {
                      setDeletingUser(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  {deletingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
