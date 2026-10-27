'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Clear old auth
    localStorage.removeItem('dams_token');
    localStorage.removeItem('dams_user');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ username, password });
      localStorage.setItem('dams_token', res.token);
      localStorage.setItem(
        'dams_user',
        JSON.stringify({
          userId: res.userId,
          username: res.username,
          name: res.name,
          email: res.email,
          role: res.role,
          regionId: res.regionId,
          stationId: res.stationId,
        })
      );
      
      let redirectUrl = '/dashboard';
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectParam = searchParams.get('redirect');
        if (redirectParam && redirectParam.startsWith('/')) {
          redirectUrl = redirectParam;
        }
      }
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleUser: string) => {
    setUsername(roleUser);
    setPassword('password123');
  };

  const demoAccounts = [
    { label: 'Super Admin', username: 'admin' },
    { label: 'Regional Mgr', username: 'rm_accra' },
    { label: 'Station Mgr', username: 'sm_tema' },
    { label: 'Asset Officer', username: 'officer' },
    { label: 'Auditor', username: 'auditor' },
  ];

  return (
    <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-slate-950/50 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">DVLA Ghana</h1>
        <p className="text-sm text-slate-400">Asset Management System (DAMS)</p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Username</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <UserIcon className="w-5 h-5" />
            </span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-200 text-sm placeholder-slate-600 transition-colors focus:outline-none"
              placeholder="Enter username"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Lock className="w-5 h-5" />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-200 text-sm placeholder-slate-600 transition-colors focus:outline-none"
              placeholder="Enter password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-800"></div>
        <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Quick Demo Login</span>
        <div className="flex-grow border-t border-slate-800"></div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {demoAccounts.map((acc) => (
          <button
            key={acc.username}
            onClick={() => handleQuickLogin(acc.username)}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium transition-colors text-left truncate"
          >
            {acc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
