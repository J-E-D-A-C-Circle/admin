'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Sparkles,
  Info,
  CheckCircle2,
  Send
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'EMS Admin Officer',
    badge: 'Kumasi Station',
    username: 'ems_officer',
    password: 'password123',
    desc: 'Logs postal dispatches, uploads receipts & submits returns for Kumasi Station.',
    tagBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
  },
  {
    role: 'EMS Station Manager',
    badge: 'Kumasi Head',
    username: 'ems_mgr',
    password: 'password123',
    desc: 'Verifies or rejects dispatches from own station with mandatory reason.',
    tagBg: 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
  },
  {
    role: 'EMS Director, Admin HQ',
    badge: 'HQ National',
    username: 'ems_director',
    password: 'password123',
    desc: 'National oversight, final monthly return approvals, unlocks & master reports.',
    tagBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
  },
  {
    role: 'EMS IT Admin',
    badge: 'System Admin',
    username: 'ems_it',
    password: 'password123',
    desc: 'Manages EMS users, assigns offices, handles backups. Zero access to money data.',
    tagBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
  },
  {
    role: 'EMS Finance / Audit',
    badge: 'Read-Only Audit',
    username: 'ems_audit',
    password: 'password123',
    desc: 'View & export only, expenditure verification, tamper-proof logs.',
    tagBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
  },
  {
    role: 'Super Administrator',
    badge: 'Full Root Access',
    username: 'admin',
    password: 'password123',
    desc: 'Unrestricted master control across all offices, roles and modules.',
    tagBg: 'bg-slate-800 text-slate-200 border border-slate-700'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('ems_officer');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const userToSubmit = customUser || username;
    const passToSubmit = customPass || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userToSubmit,
          password: passToSubmit,
          system: 'EMS'
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      if (data.token) {
        localStorage.setItem('ems_token', data.token);
        localStorage.setItem('dams_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('ems_user', JSON.stringify(data.user));
        localStorage.setItem('dams_user', JSON.stringify(data.user));
      }

      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(acc.username);
    setPassword(acc.password);
    handleLogin(undefined, acc.username, acc.password);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      {/* Background Subtle Gradient & Grid Accent */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Crest */}
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white shadow-[0_0_20px_rgba(212,175,55,0.25)] p-2 mb-4 border border-amber-500/40">
          <img src="/logo.png" alt="DVLA Ghana" className="h-full w-full object-contain" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>DVLA EMS PORTAL</span>
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400 font-medium max-w-sm mx-auto">
          GhanaPost Express Mail Service Tracking &amp; Expenditure Control
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl shadow-slate-950/80 p-6 sm:p-8">
          
          {/* Left Form: Direct Login */}
          <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 pb-6 lg:pb-0 lg:pr-8">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Secure Sign In</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Official SRS v2.4
                </span>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-900/60 text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username or Work Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. ems_officer"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Account Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to EMS Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Protected by SHA-256 JWT &amp; PFMA Role Scoping</span>
              </div>
            </div>
          </div>

          {/* Right Section: Quick One-Click Demo Accounts */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-bold text-white">One-Click Role Demonstration</h2>
                </div>
                <span className="text-[11px] text-slate-500">Click any card to log in directly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => selectDemoAccount(acc)}
                    disabled={loading}
                    className="text-left p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:bg-slate-800/40 hover:border-amber-500/40 transition-all group cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                        {acc.role}
                      </span>
                      <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md ${acc.tagBg}`}>
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {acc.desc}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span className="text-amber-400 font-semibold">{acc.username}</span>
                      <span>password123</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">SRS Imprest Rule:</strong> Admin Officers log dispatches for their station. Station Managers verify or reject vouchers. HQ Director has national sign-off and unlock permissions.
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
