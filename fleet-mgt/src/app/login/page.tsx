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
  Truck,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import './login.css';

const DEMO_PASSWORD = 'password123';

const DEMO_ACCOUNTS = [
  { username: 'admin', role: 'Fleet Administrator' },
  { username: 'fleet_manager', role: 'Fleet Manager' },
  { username: 'transport_officer', role: 'Transport Officer' },
  { username: 'fleet_auditor', role: 'Fleet Auditor' },
];

const FEATURES = ['Vehicle Registry', 'Maintenance', 'Fuel Tracking', 'Driver Records'];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signIn = async (user: string, pass: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      localStorage.setItem('fleet_token', data.token);
      localStorage.setItem(
        'fleet_user',
        JSON.stringify({ userId: data.userId, username: data.username, name: data.name, email: data.email, role: data.role })
      );
      router.push('/');
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
          '--lg-accent': '#2563eb',
          '--lg-accent-dark': '#1d4ed8',
          '--lg-accent-soft': '#e8f0fe',
          '--lg-accent-ring': '#bcd2fb',
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
              <Truck /> Fleet Management
            </span>
            <h1 className="lg-title">Fleet Management Portal</h1>
            <p className="lg-desc">
              Official DVLA fleet system for vehicle registration, driver records, maintenance
              scheduling and fuel efficiency monitoring across all depots.
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
            DVLA Fleet Management &middot; Authorized Personnel Only
          </div>
        </section>

        {/* Form panel */}
        <section className="lg-form-wrap">
          <h2 className="lg-form-title">Sign In</h2>
          <p className="lg-form-sub">Enter your fleet management credentials to continue.</p>

          {error && <div className="lg-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="lg-label" htmlFor="fleet-username">Username</label>
            <div className="lg-field">
              <User className="lg-ico" />
              <input
                id="fleet-username"
                className="lg-input"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your assigned username"
              />
            </div>

            <label className="lg-label" htmlFor="fleet-password">Password</label>
            <div className="lg-field">
              <Lock className="lg-ico" />
              <input
                id="fleet-password"
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

            <button id="fleet-signin" type="submit" disabled={loading} className="lg-submit">
              {loading ? (
                <>
                  <Loader2 className="lg-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign in to Fleet Management <ArrowRight />
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
