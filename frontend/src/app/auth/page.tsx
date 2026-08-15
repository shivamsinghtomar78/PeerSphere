'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassInput } from '@/components/ui/GlassInput';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api-client';

type Role = 'student' | 'placement';
type Screen = 'role-select' | 'credentials' | 'signing-in';

// Demo credentials that match the backend seed data
const DEMO_CREDENTIALS: Record<Role, { email: string; password: string; role: 'STUDENT' | 'PLACEMENT_ADMIN' }> = {
  student: { email: 'arjun.sharma@college.edu', password: 'student123', role: 'STUDENT' },
  placement: { email: 'placement@college.edu', password: 'admin123', role: 'PLACEMENT_ADMIN' },
};

const ROLE_META: Record<Role, {
  label: string;
  badgeLabel: string;
  description: string;
  features: string[];
  destPath: string;
  accentClass: string;
}> = {
  student: {
    label: 'Student',
    badgeLabel: 'Student Access',
    description: 'Access your placement dashboard, AI match scores, skill gap diagnosis, and personalized milestone roadmaps.',
    features: [
      'Bento Readiness Dashboard',
      'Explainable AI Skill Match Scores',
      'Personalized Milestone Roadmap',
      'Application Pipeline Tracking',
    ],
    destPath: '/student',
    accentClass: 'bg-accent',
  },
  placement: {
    label: 'Placement Officer',
    badgeLabel: 'Placement Admin',
    description: 'Manage campus drives, screen candidates with AI-ranking governance, run comparison matrices, and export reports.',
    features: [
      'Multi-step Job Creation Wizard',
      'Automated Candidate Ranking & Audit',
      'Side-by-Side Comparison Matrix',
      'Campus Skill Deficit Intelligence',
    ],
    destPath: '/placement',
    accentClass: 'bg-success',
  },
};

export default function AuthPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, user, error: authError, clearError } = useAuth();
  const [screen, setScreen] = useState<Screen>('role-select');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const path = user.role === 'STUDENT' ? '/student' : '/placement';
      router.push(path);
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Clear auth error when changing screens
  useEffect(() => {
    if (screen !== 'credentials' && authError) {
      clearError();
    }
  }, [screen, authError, clearError]);

  function handleRoleSelect(role: Role) {
    setSelectedRole(role);
    // Pre-fill demo credentials
    setEmail(DEMO_CREDENTIALS[role].email);
    setPassword(DEMO_CREDENTIALS[role].password);
    setFormError('');
    clearError();
    setScreen('credentials');
  }

  function handleBack() {
    setScreen('role-select');
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setFormError('');
    clearError();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole || !email || !password) return;

    setFormError('');
    clearError();
    setScreen('signing-in');

    try {
      await login(email, password);
      // login function handles the redirect based on role
    } catch (error) {
      setScreen('credentials');
      setFormError(getErrorMessage(error));
    }
  }

  // If loading auth state, show loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-canvas">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-text-inverse font-bold text-base shadow-sm">
              P
            </div>
            <span className="font-bold text-lg tracking-tight text-text group-hover:text-accent transition-base">
              PeerSphere
            </span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </main>
      </div>
    );
  }

  // Combine form error and auth error
  const displayError = formError || authError;

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-text-inverse font-bold text-base shadow-sm">
            P
          </div>
          <span className="font-bold text-lg tracking-tight text-text group-hover:text-accent transition-base">
            PeerSphere
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher compact />
          <Link href="/">
            <GlassButton variant="ghost" size="sm">
              ← Back to Home
            </GlassButton>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {screen === 'role-select' && <RoleSelectScreen onSelect={handleRoleSelect} />}

        {screen === 'credentials' && selectedRole && (
          <CredentialsScreen
            role={selectedRole}
            email={email}
            password={password}
            showPassword={showPassword}
            error={displayError}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onTogglePassword={() => setShowPassword((p) => !p)}
            onLogin={handleLogin}
            onBack={handleBack}
          />
        )}

        {screen === 'signing-in' && selectedRole && (
          <SigningInScreen role={selectedRole} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-text-faint py-4 border-t border-border-subtle">
        PeerSphere — AI-Based Placement Matching & Skill Gap Analysis Platform
      </footer>
    </div>
  );
}

// ─── Role Selection Screen ─────────────────────────────────────────

function RoleSelectScreen({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <div className="w-full max-w-2xl space-y-8 animate-in fade-in duration-200">
      <div className="text-center space-y-2">
        <GlassBadge variant="accent" size="md">Institutional Sign-In</GlassBadge>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text">
          Sign in to PeerSphere
        </h1>
        <p className="text-text-muted text-sm max-w-md mx-auto">
          Select your role to continue to your personalised workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {(Object.entries(ROLE_META) as [Role, typeof ROLE_META[Role]][]).map(([role, meta]) => (
          <button
            key={role}
            type="button"
            onClick={() => onSelect(role)}
            className="text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)] rounded-xl"
          >
            <GlassCard
              variant="surface"
              padding="lg"
              className="h-full flex flex-col justify-between border-border hover:border-accent group-focus-visible:border-accent transition-base cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg ${meta.accentClass} flex items-center justify-center text-text-inverse font-bold text-lg shadow-sm`}>
                    {meta.label[0]}
                  </div>
                  <GlassBadge variant="default" size="sm">{meta.badgeLabel}</GlassBadge>
                </div>
                <h2 className="text-xl font-bold text-text group-hover:text-accent transition-base">
                  {meta.label}
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">{meta.description}</p>
                <ul className="space-y-1.5 pt-1">
                  {meta.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="text-success font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-5 mt-4 border-t border-border-subtle">
                <GlassButton
                  variant={role === 'student' ? 'primary' : 'secondary'}
                  size="md"
                  fullWidth
                  tabIndex={-1}
                >
                  Continue as {meta.label} →
                </GlassButton>
              </div>
            </GlassCard>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-text-faint">
        This is a demo platform. Use the pre-filled credentials on the next screen.
      </p>
    </div>
  );
}

// ─── Credentials Screen ────────────────────────────────────────────

interface CredentialsScreenProps {
  role: Role;
  email: string;
  password: string;
  showPassword: boolean;
  error: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onTogglePassword: () => void;
  onLogin: (e: React.FormEvent) => void;
  onBack: () => void;
}

function CredentialsScreen({
  role,
  email,
  password,
  showPassword,
  error,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onBack,
}: CredentialsScreenProps) {
  const meta = ROLE_META[role];
  const demo = DEMO_CREDENTIALS[role];

  return (
    <div className="w-full max-w-md space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-caption text-text-muted hover:text-text transition-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)] rounded-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Choose a different role
      </button>

      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-md ${meta.accentClass} flex items-center justify-center text-text-inverse font-bold text-sm`}>
            {meta.label[0]}
          </div>
          <GlassBadge variant="default" size="sm">{meta.badgeLabel}</GlassBadge>
        </div>
        <h1 className="text-2xl font-bold text-text">Sign in as {meta.label}</h1>
        <p className="text-sm text-text-muted">Enter your institutional credentials to continue.</p>
      </div>

      {/* Login form */}
      <GlassCard variant="surface" padding="lg">
        <form onSubmit={onLogin} className="space-y-5" noValidate>
          <GlassInput
            label="Institutional Email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@college.edu"
            autoComplete="email"
            required
            fullWidth
          />

          {/* Password field with show/hide toggle */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="w-full h-10 px-3 pr-10 text-sm rounded-sm border border-border bg-surface text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text transition-base focus-visible:outline-none"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-md bg-danger-light border border-danger/20 text-sm text-danger"
            >
              <span className="font-bold">✕</span>
              <span>{error}</span>
            </div>
          )}

          <GlassButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
          >
            Sign in to {meta.label} Portal →
          </GlassButton>
        </form>
      </GlassCard>

      {/* Demo credentials hint */}
      <GlassCard variant="canvas" padding="sm" className="text-xs text-text-muted space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-text-faint uppercase tracking-wider">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Demo Credentials
        </div>
        <div>Email: <code className="font-mono text-text">{demo.email}</code></div>
        <div>Password: <code className="font-mono text-text">{demo.password}</code></div>
      </GlassCard>
    </div>
  );
}

// ─── Signing In Screen ─────────────────────────────────────────────

function SigningInScreen({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  return (
    <div className="text-center space-y-5 animate-in fade-in duration-200">
      <div className={`w-16 h-16 rounded-2xl ${meta.accentClass} flex items-center justify-center text-text-inverse font-bold text-3xl shadow-md mx-auto`}>
        {meta.label[0]}
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text">Signing you in…</h2>
        <p className="text-sm text-text-muted">
          Redirecting to the {meta.label} workspace.
        </p>
      </div>
      {/* Simple spinner */}
      <div className="flex justify-center">
        <svg
          className="w-8 h-8 text-accent animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-label="Loading"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      </div>
    </div>
  );
}
