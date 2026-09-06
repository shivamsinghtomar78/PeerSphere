'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-12 max-w-6xl mx-auto space-y-12">
      {/* Top Navbar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-text-inverse font-bold text-lg shadow-sm">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-text">PeerSphere</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth">
            <GlassButton variant="secondary" size="sm">
              Sign In
            </GlassButton>
          </Link>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
        <GlassBadge variant="accent" size="md">
          Campus Placement Intelligence & Matching
        </GlassBadge>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text leading-tight">
          AI-Powered Placement Matching &amp; Skill Gap Analysis
        </h1>

        <p className="text-base md:text-lg text-text-muted leading-relaxed">
          Bridging campus talent and enterprise requirements through explainable skill matching, deterministic eligibility checks, and milestone-driven student improvement roadmaps.
        </p>
      </div>

      {/* Role Selection Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        {/* Student Experience Portal */}
        <GlassCard
          variant="surface"
          padding="lg"
          className="flex flex-col justify-between border-border-strong hover:border-accent transition-base shadow-md group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-caption font-bold uppercase tracking-wider text-accent">
                Portal Experience 01
              </span>
              <GlassBadge variant="default" size="sm">
                Student Access
              </GlassBadge>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-text group-hover:text-accent transition-base">
                Student Workspace
              </h2>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                Explore campus drives, inspect multi-dimensional AI match scores, diagnose missing skill gaps, and follow personal milestone roadmaps to achieve high placement readiness.
              </p>
            </div>

            <div className="pt-2 space-y-2 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <span className="text-success font-bold">✓</span> Bento Readiness Dashboard
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success font-bold">✓</span> Explainable Skill Match &amp; Confidence Breakdown
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success font-bold">✓</span> Actionable Step-by-Step Learning Roadmaps
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link href="/student" className="w-full block">
              <GlassButton variant="primary" size="lg" fullWidth>
                Enter Student Experience →
              </GlassButton>
            </Link>
          </div>
        </GlassCard>

        {/* Placement Officer Portal */}
        <GlassCard
          variant="surface"
          padding="lg"
          className="flex flex-col justify-between border-border-strong hover:border-accent transition-base shadow-md group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-caption font-bold uppercase tracking-wider text-accent">
                Portal Experience 02
              </span>
              <GlassBadge variant="default" size="sm">
                Placement Admin
              </GlassBadge>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-text group-hover:text-accent transition-base">
                Placement Officer Console
              </h2>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                Publish job specifications, screen eligible candidates with deterministic filters, review AI ranking audit logs, run multi-candidate comparison matrices, and analyze cohort skill deficits.
              </p>
            </div>

            <div className="pt-2 space-y-2 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <span className="text-success font-bold">✓</span> Multi-step Job Creation Wizard
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success font-bold">✓</span> Automated Candidate Ranking &amp; Shortlist Audit
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success font-bold">✓</span> Campus Skill Deficit Distribution Intelligence
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link href="/placement" className="w-full block">
              <GlassButton variant="secondary" size="lg" fullWidth>
                Enter Placement Console →
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* Footer Design System Reference */}
      <footer className="text-center text-xs text-text-faint py-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>PeerSphere • Liquid Glass &amp; Apple Bento Grid Design System</span>
        <span>Built with Next.js App Router, TypeScript, Tailwind CSS</span>
      </footer>
    </div>
  );
}
