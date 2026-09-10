'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { ClayButton } from '@/components/ui/ClayButton';
import { SkillChip } from '@/components/product/SkillChip';
import { MatchScore } from '@/components/product/MatchScore';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { Check, ArrowRight } from 'lucide-react';
import type { SkillStatus } from '@/types';

// ─── Static landing content (no data dependency) ───────────────────

const STATS = [
  { value: '1,248', label: 'placements facilitated' },
  { value: '+11 pts', label: 'average score lift after completing a roadmap' },
  { value: '86', label: 'drives published this academic year' },
] as const;

// The explainability showcase mirrors a real evaluation: skill evidence
// weights sum to 100 and the score decomposes into the rows shown.
const SHOWCASE_SKILLS: { name: string; weight: number; status: SkillStatus }[] = [
  { name: 'Java', weight: 25, status: 'strong' },
  { name: 'Spring Boot', weight: 20, status: 'strong' },
  { name: 'SQL', weight: 20, status: 'strong' },
  { name: 'REST APIs', weight: 20, status: 'partial' },
  { name: 'Git', weight: 15, status: 'strong' },
];

const SHOWCASE_RULES = [
  { rule: 'CGPA requirement: 7.5', actual: 'Your CGPA: 8.42 — Met' },
  { rule: 'Backlogs allowed: 0', actual: 'Your backlogs: 0 — Met' },
  { rule: 'Department: CSE or IT', actual: 'Computer Science — Met' },
] as const;

const STUDENT_STEPS = [
  {
    title: 'Upload your resume',
    text: 'Parsing extracts skills with the evidence behind each one — projects, internships, coursework.',
  },
  {
    title: 'See every drive scored',
    text: 'Each required skill rated strong, partial, or missing; each eligibility rule shown pass or fail with your numbers.',
  },
  {
    title: 'Close the gaps',
    text: 'A prioritised roadmap per missing skill: concrete steps, estimated weeks, and the score lift each gap is worth.',
  },
] as const;

const OFFICER_STEPS = [
  {
    title: 'Publish a drive',
    text: 'Set CGPA, backlog, and department rules; weight the required skills. Four steps, then live.',
  },
  {
    title: 'Review ranked candidates',
    text: 'Every rank opens into the full decomposition — skill evidence, rule results, resume — and candidates compare side by side.',
  },
  {
    title: 'Override with a reason',
    text: 'Any AI decision can be overridden. The reason is required and lands in an append-only, timestamped audit log.',
  },
] as const;

const FEATURES = [
  {
    title: 'Skill-gap roadmaps',
    text: '“You’re missing 2 of 5 required skills” — then the steps, the weeks, and the projected lift for each.',
  },
  {
    title: 'Ranking matrix',
    text: 'Candidates ranked per drive with score, eligibility, and skill coverage at a glance — each row one click from why.',
  },
  {
    title: 'Audited overrides',
    text: 'Officers stay in charge. Every override requires a written reason and is recorded permanently, with a timestamp.',
  },
  {
    title: 'Cohort analytics',
    text: 'Readiness trends, department comparisons, and the skills most commonly missing across the cohort.',
  },
] as const;

// ─── Section pieces ─────────────────────────────────────────────────

function RuleRow({ rule, actual }: { rule: string; actual: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border-subtle last:border-b-0 text-sm">
      <span
        className="shrink-0 w-5 h-5 mt-px rounded-pill bg-success-light text-success border border-[var(--ps-success)] flex items-center justify-center"
        aria-hidden="true"
      >
        <Check size={12} strokeWidth={3} />
      </span>
      <span className="text-text-muted">
        {rule} — <strong className="text-text font-semibold">{actual}</strong>
      </span>
    </div>
  );
}

function StepList({ kicker, steps }: { kicker: string; steps: readonly { title: string; text: string }[] }) {
  return (
    <GlassCard variant="surface" padding="lg">
      <span className="text-caption font-semibold uppercase tracking-wider text-accent-dark">
        {kicker}
      </span>
      <ol className="mt-2">
        {steps.map((step, i) => (
          <li key={step.title} className="flex items-start gap-3.5 py-3.5">
            <span
              className="shrink-0 w-8 h-8 mt-0.5 rounded-pill bg-accent-light text-accent-dark text-sm font-semibold flex items-center justify-center"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div>
              <div className="text-sm font-medium text-text">{step.title}</div>
              <p className="text-xs text-text-muted leading-relaxed mt-0.5">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}

// The hero visual: a live-feeling match-score breakdown, identical in
// structure to the ResumeComparison + eligibility checklist in-product.
function ExplainabilityShowcase() {
  return (
    <GlassCard variant="surface" padding="lg" className="shadow-lg space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[16rem]">
          <span className="text-caption font-semibold uppercase tracking-wider text-text-muted">
            Match breakdown
          </span>
          <h3 className="text-title font-semibold text-text mt-1">
            Graduate Software Engineer — Nimbus Systems
          </h3>
        </div>
        <MatchScore score={86} size="lg" showDetails={false} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <EligibilityBadge status="eligible" />
        <GlassBadge variant="muted">Confidence: high (91%)</GlassBadge>
      </div>

      <div>
        {SHOWCASE_SKILLS.map((sk) => (
          <div
            key={sk.name}
            className="flex items-center justify-between gap-3 py-2 border-b border-border-subtle last:border-b-0"
          >
            <span className="text-sm font-medium text-text">
              {sk.name} <span className="text-text-faint font-normal">· {sk.weight}%</span>
            </span>
            {/* Chip text is the rating, not the skill — the row already names it */}
            <SkillChip
              skill={sk.status === 'strong' ? 'Strong' : sk.status === 'partial' ? 'Partial' : 'Missing'}
              status={sk.status}
              size="sm"
            />
          </div>
        ))}
      </div>

      <div className="rounded-md bg-surface-raised border border-border-subtle px-4 py-1.5">
        {SHOWCASE_RULES.map((r) => (
          <RuleRow key={r.rule} rule={r.rule} actual={r.actual} />
        ))}
      </div>

      <p className="text-caption text-text-muted">
        Every point traceable. Students and officers read the same breakdown.
      </p>
    </GlassCard>
  );
}

// ─── Page ───────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-[var(--ps-z-header)] glass-nav border-x-0 border-t-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-text-inverse font-bold text-lg shadow-sm">
              P
            </div>
            <span className="font-bold text-xl tracking-tight text-text">PeerSphere</span>
          </div>
          <nav className="flex items-center gap-2" aria-label="Landing">
            <GlassButton variant="ghost" size="sm" href="#how-it-works" className="hidden sm:inline-flex">
              How it works
            </GlassButton>
            <GlassButton variant="ghost" size="sm" href="#features" className="hidden sm:inline-flex">
              Features
            </GlassButton>
            <GlassButton variant="secondary" size="sm" href="/auth">
              Sign in
            </GlassButton>
            <ThemeSwitcher />
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center px-6 pt-12 lg:pt-18 pb-14">
        <div className="space-y-6">
          <GlassBadge variant="accent" size="md">
            Campus placement intelligence
          </GlassBadge>
          <h1 className="text-display text-text" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)' }}>
            Explainable.
            <br />
            Never black-box.
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-xl">
            PeerSphere matches students to campus drives with deterministic scoring. Every match
            decomposes into per-skill evidence, pass–fail eligibility rules, and a roadmap that says
            exactly what to learn to raise it.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <ClayButton size="lg" href="/auth" rightIcon={<ArrowRight size={18} aria-hidden />}>
              Enter as student
            </ClayButton>
            <GlassButton variant="secondary" size="lg" href="/auth">
              Enter as placement officer
            </GlassButton>
          </div>
          <p className="text-caption text-text-muted">
            No score on this platform is more than one click from its full breakdown.
          </p>
        </div>

        <ExplainabilityShowcase />
      </section>

      {/* ── Social proof / stats band ── */}
      <section aria-label="Platform outcomes" className="max-w-6xl mx-auto w-full px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS.map((s) => (
            <GlassCard key={s.label} variant="surface" padding="lg" className="text-center">
              <div className="text-3xl font-bold tracking-tight text-accent-dark tabular">{s.value}</div>
              <div className="text-caption text-text-muted mt-1">{s.label}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" aria-label="How it works" className="max-w-6xl mx-auto w-full px-6 py-12 space-y-6">
        <h2 className="text-h2 text-text">How it works</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StepList kicker="For students" steps={STUDENT_STEPS} />
          <StepList kicker="For placement officers" steps={OFFICER_STEPS} />
        </div>
      </section>

      {/* ── Feature highlights ── */}
      <section id="features" aria-label="Features" className="max-w-6xl mx-auto w-full px-6 py-12 space-y-6">
        <h2 className="text-h2 text-text">Built for decisions people can defend</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <GlassCard key={f.title} padding="lg" className="space-y-2">
              <h3 className="font-semibold text-text">{f.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{f.text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <span>PeerSphere — placement matching &amp; skill-gap analysis</span>
          <nav className="flex items-center gap-4" aria-label="Footer">
            <Link href="/auth" className="hover:text-text transition-base">
              Student sign-in
            </Link>
            <Link href="/auth" className="hover:text-text transition-base">
              Officer sign-in
            </Link>
            <Link href="#how-it-works" className="hover:text-text transition-base">
              How it works
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
