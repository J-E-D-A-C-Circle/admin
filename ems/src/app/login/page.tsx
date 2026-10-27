'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import './login.css';

const DEMO_ACCOUNTS = [
  { username: 'ems_officer', role: 'EMS Admin Officer' },
  { username: 'ems_mgr', role: 'EMS Station Manager' },
  { username: 'ems_director', role: 'Director, Administration' },
  { username: 'admin', role: 'Super Administrator' },
];

const DEMO_PASSWORD = 'password123';

const FEATURES = ['Dispatch Tracking', 'Receipt Evidence', 'Monthly Returns', 'Director Approval'];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: customUser || username,
          password: customPass || password,
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

  const selectDemoAccount = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setUsername(acc.username);
    setPassword(DEMO_PASSWORD);
    handleLogin(undefined, acc.username, DEMO_PASSWORD);
  };

  return (
    <main
      className="lg-page"
      style={
        {
          '--lg-accent': '#059669',
          '--lg-accent-dark': '#047857',
          '--lg-accent-soft': '#e6f7ef',
          '--lg-accent-ring': '#b7e8d0',
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
              <Mail /> GhanaPost EMS
            </span>
            <h1 className="lg-title">GhanaPost EMS Portal</h1>
            <p className="lg-desc">
              Official DVLA postal dispatch tracking system for monitoring correspondence letters,
              tracking numbers, receipt uploads, and monthly return validation.
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
            DVLA EMS Tracking &middot; Authorized Personnel Only
          </div>
        </section>

        {/* Form panel */}
        <section className="lg-form-wrap">
          <h2 className="lg-form-title">Sign In</h2>
          <p className="lg-form-sub">Enter your EMS credentials to continue.</p>

          {error && <div className="lg-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <label className="lg-label" htmlFor="ems-username">Username or Email</label>
            <div className="lg-field">
              <User className="lg-ico" />
              <input
                id="ems-username"
                className="lg-input"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your assigned username or email"
              />
            </div>

            <label className="lg-label" htmlFor="ems-password">Password</label>
            <div className="lg-field">
              <Lock className="lg-ico" />
              <input
                id="ems-password"
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

            <button id="ems-signin" type="submit" disabled={loading} className="lg-submit">
              {loading ? (
                <>
                  <Loader2 className="lg-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign in to GhanaPost EMS <ArrowRight />
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
                  onClick={() => selectDemoAccount(acc)}
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
