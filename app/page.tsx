'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { BentoGrid, BentoCard } from '@/components/ui/BentoGrid';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/MotionPrimitives';
import { HeroStageShow } from '@/components/product/HeroStageShow';
import { UploadStageMini, ChartScrubStageMini } from '@/components/product/BentoStageMinis';
import { PeerSphereStageShow } from '@/components/product/PeerSphereStageShow';
import { OfficerOverrideStageShow } from '@/components/product/OfficerOverrideStageShow';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import {
  ArrowRight,
  ShieldCheck,
  GitBranch,
  BarChart3,
  Layers,
  ChevronDown,
  FileCheck2,
} from 'lucide-react';

const CAPABILITY_PILLARS = [
  { value: '3 Pure Engines', label: 'Eligibility, weighted matching & skill-gap roadmaps' },
  { value: 'SHA-256', label: 'Immutable evaluation snapshots for 100% reproducibility' },
  { value: 'Append-Only', label: 'Timestamped override & audit trail governance' },
] as const;

const STUDENT_STEPS = [
  {
    title: 'Build your verified profile',
    text: 'Manage skills from the canonical taxonomy and upload SHA-256 verified PDF resumes.',
  },
  {
    title: 'Run deterministic drive evaluations',
    text: 'Each required skill is scored Strong, Partial, or Missing alongside pass/fail eligibility rules.',
  },
  {
    title: 'Follow your skill-gap roadmap',
    text: 'Get prioritized weekly steps, estimated duration, and projected score lift per missing skill.',
  },
] as const;

const OFFICER_STEPS = [
  {
    title: 'Publish versioned campus drives',
    text: 'Set CGPA, backlog, and department constraints with weighted skill requirements in JobVersion.',
  },
  {
    title: 'Rank & compare candidates',
    text: 'Review ranked applicants, inspect per-skill evidence, and compare finalists side by side.',
  },
  {
    title: 'Override with full accountability',
    text: 'Every manual override requires a written reason and writes to an append-only AuditEvent log.',
  },
] as const;

const PREVIEWS = [
  {
    src: '/images/previews/06-student-dashboard-ok.png',
    title: 'Student Readiness Bento',
    desc: 'Readiness score, top drive match, skill-gap summary, and application status in one view.',
  },
  {
    src: '/images/previews/02-admin-dashboard.png',
    title: 'Placement Operations Hub',
    desc: 'Live cohort KPIs, top ranked candidates, and campus-wide skill-gap intelligence.',
  },
  {
    src: '/images/previews/03-candidates.png',
    title: 'Ranked Candidate Matrix',
    desc: 'Filterable per-drive rankings with confidence indicators and one-click deep dive.',
  },
  {
    src: '/images/previews/07-student-jobs.png',
    title: 'Eligible Drive Discovery',
    desc: 'Published campus drives with transparent CGPA, backlog, and department criteria.',
  },
] as const;

const FAQS = [
  {
    q: 'Why does PeerSphere use deterministic engines instead of black-box LLM scoring?',
    a: 'In high-stakes campus placements, every point must be defensible. Deterministic engines eliminate hallucinations, guarantee identical scores on re-runs via SHA-256 snapshot hashes, and trace every point to explicit rules and skill evidence.',
  },
  {
    q: 'Can placement officers override an automated recommendation?',
    a: 'Yes. Officers can record shortlist, reject, review, or promote overrides with a mandatory written reason. The original evaluation remains intact while the override is appended to the audit trail.',
  },
  {
    q: 'What happens when a job requirement is updated?',
    a: 'Draft edits create a new JobVersion record so historical evaluations linked to earlier versions are never corrupted.',
  },
  {
    q: 'How are uploaded student resumes validated?',
    a: 'Resumes undergo MIME type checks, 5 MB size limits, %PDF- magic-byte inspection, and SHA-256 checksum hashing before storage.',
  },
] as const;

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [walkthroughTab, setWalkthroughTab] = useState<'student' | 'officer'>('student');

  return (
    <div className="ps-marketing min-h-screen flex flex-col bg-canvas">
      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-[var(--ps-z-header)] glass-nav border-x-0 border-t-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-5 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="ps-brand-mark w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-text-inverse font-bold text-lg shadow-sm">
              P
            </div>
            <span className="font-bold text-xl tracking-tight text-text">PeerSphere</span>
          </div>
          <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Landing">
            <GlassButton variant="ghost" size="sm" href="#features" className="hidden md:inline-flex">
              Features
            </GlassButton>
            <GlassButton variant="ghost" size="sm" href="#how-it-works" className="hidden md:inline-flex">
              How it works
            </GlassButton>
            <GlassButton variant="ghost" size="sm" href="#previews" className="hidden md:inline-flex">
              Previews
            </GlassButton>
            <GlassButton variant="ghost" size="sm" href="#faq" className="hidden sm:inline-flex">
              FAQ
            </GlassButton>
            <GlassButton variant="primary" size="sm" href="/auth">
              Sign in
            </GlassButton>
            <ThemeSwitcher compact />
          </nav>
        </div>
      </header>

      {/* ── Hero Section with Architectural Mesh Backdrop ── */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <img
          src="/images/hero-mesh.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
        />
        <PageTransition className="relative max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-14 items-center px-5 sm:px-6 pt-14 lg:pt-20 pb-16 lg:pb-24">
          <div className="space-y-6">
            <GlassBadge variant="accent" size="md">
              Institutional Placement Intelligence
            </GlassBadge>
            <h1 className="text-display text-text max-w-xl" style={{ fontSize: 'clamp(2.4rem, 4.8vw, 4.1rem)', lineHeight: 1.04 }}>
              Explainable.
              <br />
              Never black-box.
            </h1>
            <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-xl">
              PeerSphere matches students to campus recruitment drives using deterministic scoring.
              Every evaluation decomposes into per-skill evidence, pass–fail eligibility rules,
              and a prioritized roadmap to close skill gaps.
            </p>
            <div className="flex items-center gap-3 flex-wrap pt-1">
              <GlassButton variant="primary" size="lg" href="/auth" rightIcon={<ArrowRight size={18} aria-hidden />}>
                Enter as student
              </GlassButton>
              <GlassButton variant="secondary" size="lg" href="/auth">
                Enter as placement officer
              </GlassButton>
            </div>
            <p className="text-caption text-text-muted">
              No score on this platform is more than one click from its full rule &amp; skill breakdown.
            </p>
          </div>

          <HeroStageShow />
        </PageTransition>
      </section>

      {/* ── Factual Architecture Pillars ── */}
      <section aria-label="Platform architecture pillars" className="max-w-6xl mx-auto w-full px-5 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CAPABILITY_PILLARS.map((p) => (
            <BentoCard key={p.value} tone="surface" padding="md" className="text-center">
              <div className="text-2xl font-bold tracking-tight text-accent-dark">{p.value}</div>
              <div className="text-xs text-text-muted mt-1">{p.label}</div>
            </BentoCard>
          ))}
        </div>
      </section>

      {/* ── Extensive Bento Feature Grid ── */}
      <section id="features" aria-label="Features" className="max-w-6xl mx-auto w-full px-5 sm:px-6 py-12 lg:py-16 space-y-8">
        <ScrollReveal>
          <div className="space-y-2 max-w-2xl">
            <GlassBadge variant="default" size="sm">Core Capabilities</GlassBadge>
            <h2 className="text-h2 text-text">Built for decisions people can defend</h2>
            <p className="text-sm text-text-muted">
              Designed in an asymmetrical Bento layout so students and placement officers see the right level of detail at a glance.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer>
          <BentoGrid columns={3} gap="md">
            <StaggerItem className="col-span-1 md:col-span-2 lg:row-span-2 flex">
              <BentoCard span="hero" tone="accent" interactive className="w-full justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-dark uppercase tracking-wider">
                    <Layers size={15} />
                    Zero-Hallucination Skill Matching
                  </div>
                  <h3 className="text-2xl font-bold text-text">
                    Exact, alias, and fallback resolution with confidence gating
                  </h3>
                  <p className="text-sm text-text-muted max-w-lg leading-relaxed">
                    Skills are matched against canonical taxonomy names and aliases, weighted by requirement importance, and flagged for human review whenever confidence drops below 60%.
                  </p>
                </div>
                <div className="rounded-xl overflow-hidden border border-border-subtle bg-surface/80">
                  <img
                    src="/images/bento-network.svg"
                    alt="Deterministic skill taxonomy matching network"
                    className="w-full h-44 object-cover"
                  />
                </div>
              </BentoCard>
            </StaggerItem>

            <StaggerItem className="flex">
              <BentoCard tone="ink" interactive className="w-full">
                <div className="space-y-2">
                  <ShieldCheck size={20} className="text-[#ffbd59]" />
                  <h3 className="text-lg font-bold">Audited Overrides</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Placement officers stay in control. Every manual override requires a written reason and lands in an append-only AuditEvent table.
                  </p>
                </div>
              </BentoCard>
            </StaggerItem>

            <StaggerItem className="flex">
              <BentoCard tone="surface" interactive className="w-full">
                <div className="space-y-2">
                  <GitBranch size={20} className="text-accent" />
                  <h3 className="text-lg font-bold text-text">Actionable Skill-Gap Roadmaps</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Missing and partial skills are ranked by potential score lift with 5 curated improvement steps and estimated learning weeks.
                  </p>
                </div>
              </BentoCard>
            </StaggerItem>

            <StaggerItem className="flex">
              <BentoCard tone="surface" interactive className="w-full">
                <div className="space-y-2">
                  <FileCheck2 size={20} className="text-success" />
                  <h3 className="text-lg font-bold text-text">Verified PDF Resumes</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Magic-byte (%PDF-) content inspection, 5 MB bounds, and SHA-256 checksums protect every uploaded resume version.
                  </p>
                </div>
                <UploadStageMini />
              </BentoCard>
            </StaggerItem>

            <StaggerItem className="col-span-1 md:col-span-2 flex">
              <BentoCard span="wide" tone="raised" interactive className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-md">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-dark uppercase tracking-wider">
                      <BarChart3 size={15} />
                      Cohort Analytics &amp; Live CSV Reports
                    </div>
                    <h3 className="text-lg font-bold text-text">
                      Real-time placement funnels, department breakdowns &amp; skill deficits
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Scrub across weekly cohort readiness trends and export 6 live database-backed reports to UTF-8 CSV.
                    </p>
                  </div>
                  <ChartScrubStageMini />
                </div>
              </BentoCard>
            </StaggerItem>
          </BentoGrid>
        </StaggerContainer>
      </section>

      {/* ── Interactive Stageshow Walkthroughs ── */}
      <section aria-label="Interactive product walkthroughs" className="max-w-6xl mx-auto w-full px-5 sm:px-6 py-10 lg:py-14 space-y-6">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <GlassBadge variant="accent" size="sm">Interactive Walkthroughs</GlassBadge>
              <h2 className="text-h2 text-text">See both sides of the placement loop</h2>
              <p className="text-sm text-text-muted">
                Switch between the Student Skill-Gap Roadmap loop and the Placement Officer Audited Override workflow.
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-surface p-1 border border-border shadow-sm self-start" role="tablist" aria-label="Walkthrough role">
              <button
                type="button"
                role="tab"
                aria-selected={walkthroughTab === 'student'}
                onClick={() => setWalkthroughTab('student')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-base ${
                  walkthroughTab === 'student' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                Student Skill-Gap Loop
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={walkthroughTab === 'officer'}
                onClick={() => setWalkthroughTab('officer')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-base ${
                  walkthroughTab === 'officer' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                Officer Audited Override
              </button>
            </div>
          </div>
        </ScrollReveal>
        {walkthroughTab === 'student' ? <PeerSphereStageShow /> : <OfficerOverrideStageShow />}
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" aria-label="How it works" className="max-w-6xl mx-auto w-full px-5 sm:px-6 py-12 lg:py-16 space-y-8">
        <ScrollReveal>
          <h2 className="text-h2 text-text">How it works</h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BentoCard tone="surface" padding="lg">
            <span className="text-caption font-semibold uppercase tracking-wider text-accent-dark">
              For Students
            </span>
            <ol className="mt-3 divide-y divide-border-subtle">
              {STUDENT_STEPS.map((step, i) => (
                <li key={step.title} className="flex items-start gap-3.5 py-4 first:pt-2 last:pb-0">
                  <span className="shrink-0 w-8 h-8 rounded-pill bg-accent-light text-accent-dark text-sm font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-text">{step.title}</div>
                    <p className="text-xs text-text-muted leading-relaxed mt-0.5">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </BentoCard>

          <BentoCard tone="surface" padding="lg">
            <span className="text-caption font-semibold uppercase tracking-wider text-accent-dark">
              For Placement Officers
            </span>
            <ol className="mt-3 divide-y divide-border-subtle">
              {OFFICER_STEPS.map((step, i) => (
                <li key={step.title} className="flex items-start gap-3.5 py-4 first:pt-2 last:pb-0">
                  <span className="shrink-0 w-8 h-8 rounded-pill bg-accent-light text-accent-dark text-sm font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-text">{step.title}</div>
                    <p className="text-xs text-text-muted leading-relaxed mt-0.5">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </BentoCard>
        </div>
      </section>

      {/* ── Verified Product Previews ── */}
      <section id="previews" aria-label="Product previews" className="max-w-6xl mx-auto w-full px-5 sm:px-6 py-12 lg:py-16 space-y-8">
        <ScrollReveal>
          <div className="space-y-2">
            <GlassBadge variant="default" size="sm">Inside PeerSphere</GlassBadge>
            <h2 className="text-h2 text-text">Real application views</h2>
            <p className="text-sm text-text-muted">
              Actual workspaces from the live Student and Placement Officer portals.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PREVIEWS.map((item) => (
            <BentoCard key={item.title} tone="surface" padding="md" interactive className="group">
              <div className="rounded-lg overflow-hidden border border-border-subtle bg-canvas-subtle mb-4">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-56 object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <h3 className="text-base font-bold text-text">{item.title}</h3>
              <p className="text-xs text-text-muted mt-1">{item.desc}</p>
            </BentoCard>
          ))}
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" aria-label="Frequently asked questions" className="max-w-4xl mx-auto w-full px-5 sm:px-6 py-12 lg:py-16 space-y-6">
        <ScrollReveal>
          <h2 className="text-h2 text-text text-center">Frequently asked questions</h2>
        </ScrollReveal>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <BentoCard key={faq.q} tone="surface" padding="none">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
                >
                  <span className="text-sm font-semibold text-text">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-text-muted leading-relaxed border-t border-border-subtle pt-3">
                    {faq.a}
                  </div>
                )}
              </BentoCard>
            );
          })}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-6xl mx-auto w-full px-5 sm:px-6 pb-16">
        <BentoCard tone="ink" padding="lg" className="text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Ready to explore PeerSphere?</h2>
              <p className="text-sm text-slate-300 max-w-xl">
                Sign in with the seeded Student or Placement Officer credentials to inspect live evaluations, roadmaps, and governance logs.
              </p>
            </div>
            <GlassButton variant="primary" size="lg" href="/auth" rightIcon={<ArrowRight size={18} />}>
              Launch Workspace
            </GlassButton>
          </div>
        </BentoCard>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-border-subtle">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <span>PeerSphere — Explainable Campus Placement Matching &amp; Skill-Gap Analysis</span>
          <nav className="flex items-center gap-4" aria-label="Footer">
            <Link href="/auth" className="hover:text-text transition-base">Student sign-in</Link>
            <Link href="/auth" className="hover:text-text transition-base">Officer sign-in</Link>
            <Link href="#features" className="hover:text-text transition-base">Features</Link>
            <Link href="#faq" className="hover:text-text transition-base">FAQ</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
