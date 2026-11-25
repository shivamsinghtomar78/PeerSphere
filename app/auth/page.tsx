'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassInput } from '@/components/ui/GlassInput';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { PageTransition } from '@/components/ui/MotionPrimitives';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api-client';
import { ShieldCheck, Sparkles, GitBranch, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';

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
    description: 'Access your placement readiness Bento dashboard, explainable match scores, and skill-gap roadmaps.',
    features: [
      'Bento Readiness Dashboard',
      'Explainable Skill Match Scores',
      'Prioritized Milestone Roadmap',
      'Application Pipeline Tracking',
    ],
    destPath: '/student',
    accentClass: 'bg-accent',
  },
  placement: {
    label: 'Placement Officer',
    badgeLabel: 'Placement Admin',
    description: 'Publish campus drives, screen ranked candidates, run comparison matrices, and export live reports.',
    features: [
      'Versioned Drive Creation',
      'Automated Candidate Ranking',
      'Side-by-Side Comparison Matrix',
      'Audited Override Governance',
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

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const path = user.role === 'STUDENT' ? '/student' : '/placement';
      router.push(path);
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (screen !== 'credentials' && authError) {
      clearError();
    }
  }, [screen, authError, clearError]);

  function handleRoleSelect(role: Role) {
    setSelectedRole(role);
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
    } catch (error) {
      setScreen('credentials');
      setFormError(getErrorMessage(error));
    }
  }

  if (isLoading) {
    return (
      <div className="ps-auth min-h-screen flex flex-col bg-canvas">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="ps-brand-mark w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-text-inverse font-bold text-base shadow-sm">
              P
            </div>
            <span className="font-bold text-lg tracking-tight text-text">PeerSphere</span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" aria-label="Loading authentication" />
        </main>
      </div>
    );
  }

  const displayError = formError || authError;

  return (
    <div className="ps-auth min-h-screen flex flex-col bg-canvas">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-border-subtle">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="ps-brand-mark w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-text-inverse font-bold text-base shadow-sm">
            P
          </div>
          <span className="font-bold text-lg tracking-tight text-text group-hover:text-accent transition-base">
            PeerSphere
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher compact />
          <Link href="/">
            <GlassButton variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />}>
              Back to Home
            </GlassButton>
          </Link>
        </div>
      </header>

      {/* Split-screen main */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 lg:py-12 gap-8 items-center">
        {/* Left editorial Bento showcase (desktop) */}
        <aside className="hidden lg:flex lg:col-span-5 flex-col gap-4">
          <div className="rounded-2xl bg-[#122038] text-white p-7 border border-white/10 shadow-xl space-y-6 relative overflow-hidden">
            <div
              className="absolute -right-14 -top-14 w-48 h-48 rounded-full opacity-25 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #ffbd59, transparent 70%)' }}
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-[#ffbd59] w-fit">
              <Sparkles size={13} />
              Explainable Placement Intelligence
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight leading-snug">
                Every score traceable. Every decision defensible.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sign in to access your role-scoped workspace—built on deterministic eligibility rules, weighted skill matching, and append-only audit logs.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 flex items-start gap-3">
                <ShieldCheck size={18} className="text-[#ffbd59] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Zero-Hallucination Scoring</div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    SHA-256 input snapshots guarantee 100% reproducible evaluations.
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 flex items-start gap-3">
                <GitBranch size={18} className="text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Actionable Skill-Gap Roadmaps</div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Prioritized weekly steps and projected score lift for every gap.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right auth flow */}
        <section className="lg:col-span-7 flex items-center justify-center w-full">
          <PageTransition className="w-full max-w-xl">
            {screen === 'role-select' && <RoleSelectScreen onSelect={handleRoleSelect} />}

            {screen === 'credentials' && selectedRole && (
              <CredentialsScreen
                role={selectedRole}
                email={email}
                password={password}
                showPassword={showPassword}
                error={displayError ?? ''}
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
          </PageTransition>
        </section>
      </main>

      <footer className="text-center text-xs text-text-faint py-4 border-t border-border-subtle">
        PeerSphere — AI-Based Placement Matching &amp; Skill Gap Analysis Platform
      </footer>
    </div>
  );
}

function RoleSelectScreen({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <GlassBadge variant="accent" size="md">Institutional Sign-In</GlassBadge>
        <h1 className="text-3xl font-bold tracking-tight text-text">
          Sign in to PeerSphere
        </h1>
        <p className="text-text-muted text-sm">
          Select your institutional role to continue to your workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              className="h-full flex flex-col justify-between border-border hover:border-accent hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg ${meta.accentClass} flex items-center justify-center text-text-inverse font-bold text-lg shadow-sm`}>
                    {meta.label[0]}
                  </div>
                  <GlassBadge variant="default" size="sm">{meta.badgeLabel}</GlassBadge>
                </div>
                <h2 className="text-lg font-bold text-text group-hover:text-accent transition-base">
                  {meta.label}
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">{meta.description}</p>
                <ul className="space-y-1.5 pt-1">
                  {meta.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="text-success font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 mt-4 border-t border-border-subtle">
                <span
                  aria-hidden
                  className={
                    role === 'student'
                      ? 'inline-flex items-center justify-center w-full h-10 px-3 text-xs sm:text-sm gap-1.5 font-medium whitespace-nowrap rounded-md bg-accent text-text-inverse shadow-sm group-hover:bg-accent-dark transition-base'
                      : 'inline-flex items-center justify-center w-full h-10 px-3 text-xs sm:text-sm gap-1.5 font-medium whitespace-nowrap rounded-md bg-surface-raised text-text border border-border shadow-sm group-hover:border-border-strong transition-base'
                  }
                >
                  Continue as {meta.label} <ArrowRight size={15} />
                </span>
              </div>
            </GlassCard>
          </button>
        ))}
      </div>

      <p className="text-xs text-text-faint">
        Seeded demo credentials are pre-filled on the next step for evaluation.
      </p>
    </div>
  );
}

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
    <div className="w-full max-w-md mx-auto space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-caption text-text-muted hover:text-text transition-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)] rounded-sm"
      >
        <ArrowLeft size={14} />
        Choose a different role
      </button>

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

      <GlassCard variant="surface" padding="lg">
        <form onSubmit={onLogin} className="space-y-4" noValidate>
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

          <div className="space-y-1">
            <label htmlFor="auth-password" className="text-sm font-medium text-text-muted block">Password</label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="w-full h-10 px-3 pr-10 text-sm rounded-md border border-border bg-surface text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text transition-base focus-visible:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-md bg-danger-light border border-danger/20 text-sm text-danger"
            >
              <span className="font-bold">✕</span>
              <span>{error}</span>
            </div>
          )}

          <GlassButton type="submit" variant="primary" size="lg" fullWidth>
            Sign in to {meta.label} Portal →
          </GlassButton>
        </form>
      </GlassCard>

      <GlassCard variant="canvas" padding="sm" className="text-xs text-text-muted space-y-1">
        <div className="font-semibold text-text-faint uppercase tracking-wider">Demo Credentials</div>
        <div>Email: <code className="font-mono text-text">{demo.email}</code></div>
        <div>Password: <code className="font-mono text-text">{demo.password}</code></div>
      </GlassCard>
    </div>
  );
}

function SigningInScreen({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  return (
    <div className="text-center space-y-5 py-8">
      <div className={`w-16 h-16 rounded-2xl ${meta.accentClass} flex items-center justify-center text-text-inverse font-bold text-3xl shadow-md mx-auto`}>
        {meta.label[0]}
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text">Signing you in…</h2>
        <p className="text-sm text-text-muted">
          Redirecting to the {meta.label} workspace.
        </p>
      </div>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" aria-label="Loading" />
      </div>
    </div>
  );
}
