'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { ClayButton, ClayChip } from '@/components/ui/ClayButton';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { Target, ShieldCheck, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';

// Product-truth stats (static; landing page has no data dependency)
const STATS = [
  { value: '3', label: 'deterministic matching engines' },
  { value: '100%', label: 'explainable match decisions' },
  { value: '0', label: 'black-box scores — every point traceable' },
] as const;

const FEATURES = [
  {
    icon: Target,
    title: 'Semantic skill matching',
    text: 'Weighted skill-to-requirement matching with exact, alias, and keyword strategies — every score decomposable per requirement.',
  },
  {
    icon: ShieldCheck,
    title: 'Deterministic eligibility',
    text: 'CGPA, backlog, department, and program rules evaluated transparently, with every passed and failed rule listed.',
  },
  {
    icon: TrendingUp,
    title: 'Skill-gap roadmaps',
    text: 'Prioritized learning plans per missing skill: concrete steps, estimated weeks, and the score lift closing each gap earns.',
  },
  {
    icon: BarChart3,
    title: 'Placement analytics',
    text: 'Cohort-level funnels, skill-deficit distributions, and human-review audit trails for placement officers.',
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col p-6 md:p-12 max-w-6xl mx-auto gap-14">
      {/* ── Navbar ── */}
      <header className="flex items-center justify-between min-h-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-text-inverse font-bold text-lg shadow-sm">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-text">PeerSphere</span>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton variant="secondary" size="sm" href="/auth">
            Sign In
          </GlassButton>
          <ThemeSwitcher />
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="text-center max-w-3xl mx-auto space-y-6 min-h-[16rem]">
        <GlassBadge variant="accent" size="md">
          Campus Placement Intelligence &amp; Matching
        </GlassBadge>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text leading-tight">
          AI-Powered Placement Matching &amp; Skill Gap Analysis
        </h1>

        <p className="text-base md:text-lg text-text-muted leading-relaxed">
          Bridging campus talent and enterprise requirements through explainable
          skill matching, deterministic eligibility checks, and milestone-driven
          student improvement roadmaps.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2 min-h-12">
          <ClayButton size="lg" href="/auth" rightIcon={<ArrowRight size={18} aria-hidden />}>
            Get Started
          </ClayButton>
          <GlassButton variant="ghost" size="lg" href="#features">
            See how it works
          </GlassButton>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section aria-label="Platform facts" className="max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center space-y-1 py-2">
              <div className="text-4xl font-bold text-accent tabular-nums">{s.value}</div>
              <div className="text-sm text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section id="features" aria-label="Features" className="space-y-6">
        <h2 className="text-2xl font-bold text-text text-center">
          Explainable by design
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <GlassCard key={title} padding="lg" className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-accent-light text-accent flex items-center justify-center">
                <Icon size={20} aria-hidden />
              </div>
              <h3 className="font-semibold text-text">{title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ── Portal cards ── */}
      <section aria-label="Portals" className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        <GlassCard
          variant="surface"
          padding="lg"
          className="flex flex-col justify-between border-border-strong hover:border-accent transition-base shadow-md group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <ClayChip size="sm">Student Access</ClayChip>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text group-hover:text-accent transition-base">
                Student Workspace
              </h3>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                Explore campus drives, inspect AI match scores, diagnose skill
                gaps, and follow milestone roadmaps to placement readiness.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <GlassButton variant="primary" size="lg" fullWidth href="/student">
              Enter Student Experience →
            </GlassButton>
          </div>
        </GlassCard>

        <GlassCard
          variant="surface"
          padding="lg"
          className="flex flex-col justify-between border-border-strong hover:border-accent transition-base shadow-md group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <ClayChip size="sm">Placement Admin</ClayChip>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text group-hover:text-accent transition-base">
                Placement Officer Console
              </h3>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                Publish jobs, screen eligible candidates deterministically,
                review ranked evaluations, and analyze cohort skill deficits.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <GlassButton variant="secondary" size="lg" fullWidth href="/placement">
              Enter Placement Console →
            </GlassButton>
          </div>
        </GlassCard>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto text-center text-xs text-text-faint py-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>PeerSphere — placement matching &amp; skill-gap analysis</span>
        <nav className="flex items-center gap-4" aria-label="Footer">
          <Link href="/auth" className="hover:text-text-muted transition-base">Sign in</Link>
          <Link href="/student/jobs" className="hover:text-text-muted transition-base">Browse jobs</Link>
        </nav>
      </footer>
    </div>
  );
}
