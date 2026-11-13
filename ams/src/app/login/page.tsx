'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User as UserIcon,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Boxes,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import './login.css';

const DEMO_PASSWORD = 'password123';

const DEMO_ACCOUNTS = [
  { username: 'admin', role: 'System Administrator' },
  { username: 'officer', role: 'Asset Officer' },
  { username: 'auditor', role: 'Auditor' },
];

const FEATURES = ['Asset Register', 'Transfers', 'Verifications', 'Audit Trail'];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Clear old auth
    localStorage.removeItem('dams_token');
    localStorage.removeItem('dams_user');
  }, []);

  const signIn = async (user: string, pass: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ username: user, password: pass });
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
        const redirectParam = searchParams.get('redirect') || searchParams.get('next');
        if (redirectParam && redirectParam.startsWith('/')) {
          redirectUrl = redirectParam;
        }
        window.location.assign(redirectUrl);
        return;
      }
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(username, password);
  };

  const handleQuickLogin = (user: string) => {
    setUsername(user);
    setPassword(DEMO_PASSWORD);
    signIn(user, DEMO_PASSWORD);
  };

  return (
    <main
      className="lg-page"
      style={
        {
          '--lg-accent': '#d97706',
          '--lg-accent-dark': '#b45309',
          '--lg-accent-soft': '#fef3e2',
          '--lg-accent-ring': '#f6d9a8',
        } as React.CSSProperties
      }
    >
      <div className="lg-card">
        {/* Brand panel */}
        <section className="lg-brand">
          <div>
            <div className="lg-org">
              <div className="lg-logo">
                <img src="/logo.png" alt="DVLA Ghana" />
              </div>
              <div>
                <div className="lg-org-name">DVLA GHANA</div>
                <div className="lg-org-sub">DRIVER &amp; VEHICLE LICENSING AUTHORITY</div>
              </div>
            </div>

            <span className="lg-pill">
              <Boxes /> DAMS
            </span>
            <h1 className="lg-title">Asset Management Portal</h1>
            <p className="lg-desc">
              Official DVLA asset register for tracking assets, inter-station transfers,
              periodic verifications and disposals across every region and station.
            </p>

            <div className="lg-chips">
              {FEATURES.map((f) => (
                <span key={f} className="lg-chip">
                  <CheckCircle2 /> {f}
                </span>
              ))}
            </div>
          </div>

          <div className="lg-foot">
            <span className="lg-dot" />
            DVLA Asset Management &middot; Authorized Personnel Only
          </div>
        </section>

        {/* Form panel */}
        <section className="lg-form-wrap">
          <h2 className="lg-form-title">Sign In</h2>
          <p className="lg-form-sub">Enter your asset management credentials to continue.</p>

          {error && <div className="lg-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="lg-label" htmlFor="ams-username">Username</label>
            <div className="lg-field">
              <UserIcon className="lg-ico" />
              <input
                id="ams-username"
                className="lg-input"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your assigned username"
              />
            </div>

            <label className="lg-label" htmlFor="ams-password">Password</label>
            <div className="lg-field">
              <Lock className="lg-ico" />
              <input
                id="ams-password"
                className="lg-input"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="lg-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <button id="ams-signin" type="submit" disabled={loading} className="lg-submit">
              {loading ? (
                <>
                  <Loader2 className="lg-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign in to Asset Management <ArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="lg-demo">
            <div className="lg-demo-head">
              <span>
                <KeyRound /> Demo quick logins
              </span>
              <em>Default: {DEMO_PASSWORD}</em>
            </div>
            <div className="lg-demo-grid">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  className="lg-demo-btn"
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc.username)}
                >
                  <span className="lg-demo-user">{acc.username}</span>
                  <span className="lg-demo-role">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
