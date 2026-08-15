'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { StatCard } from '@/components/product/StatCard';
import { MatchScore } from '@/components/product/MatchScore';
import { SkillChip } from '@/components/product/SkillChip';
import { HumanReviewBanner } from '@/components/product/HumanReviewBanner';
import { mockPlacementStats, mockSkillGapDistribution, mockCandidates } from '@/data/index';
import { mockJobs } from '@/data/jobs';
import { formatCgpa } from '@/lib/utils';

export default function PlacementDashboardPage() {
  const stats = mockPlacementStats;
  const recentCandidates = mockCandidates.slice(0, 3);
  const activeDrives = mockJobs.slice(0, 3);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Placement Cell Operations
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Campus placement drives, AI candidate matching, skill gap analytics, and shortlisting governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/placement/compare">
            <GlassButton variant="secondary" size="sm">
              Compare Candidates
            </GlassButton>
          </Link>
          <Link href="/placement/jobs">
            <GlassButton variant="primary" size="sm">
              + Post Campus Drive
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Flagged Human Review Alert if any */}
      <HumanReviewBanner note="1 candidate match evaluation for ABC Technologies has low-confidence parsing flags. Please review before finalizing the shortlist." />

      {/* Top Stat KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Registered Students"
          value={stats.totalStudents}
          delta="+12 this semester"
          deltaType="positive"
          subtext="98.4% profiles complete"
        />
        <StatCard
          label="Active Campus Drives"
          value={stats.activeJobs}
          subtext="5 closing this week"
        />
        <StatCard
          label="Total Applications"
          value={stats.totalApplications}
          delta="Avg 32 per drive"
          deltaType="neutral"
        />
        <StatCard
          label="Candidates Shortlisted"
          value={stats.shortlisted}
          delta="18 Offers Extended"
          deltaType="positive"
        />
      </div>

      {/* Apple Bento Grid */}
      <div className="bento-grid">
        {/* Bento 1: Top Candidate Rankings for Active Drive (Span 7) */}
        <GlassCard
          variant="surface"
          padding="md"
          className="col-span-12 lg:col-span-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-title text-text font-bold">Top Candidates — ABC Technologies</h3>
                <p className="text-caption text-text-muted">Ranked by explainable multi-factor skill & eligibility match</p>
              </div>
              <Link href="/placement/candidates" className="text-caption text-accent hover:underline">
                View All Ranked →
              </Link>
            </div>

            <div className="divide-y divide-border-subtle mt-2">
              {recentCandidates.map((cand, idx) => (
                <div key={cand.student.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-canvas-subtle border border-border-subtle flex items-center justify-center font-bold text-xs tabular text-text-muted">
                      #{idx + 1}
                    </span>
                    <div>
                      <Link
                        href={`/placement/candidates/${cand.student.id}`}
                        className="text-sm font-semibold text-text hover:text-accent transition-base"
                      >
                        {cand.student.name}
                      </Link>
                      <div className="text-xs text-text-muted mt-0.5">
                        {cand.student.rollNumber} • {cand.student.department} • CGPA: {formatCgpa(cand.student.cgpa)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MatchScore
                      score={cand.matchResult.overallScore}
                      confidence={cand.matchResult.confidenceScore}
                      size="sm"
                      showDetails={false}
                    />
                    <Link href={`/placement/candidates/${cand.student.id}`}>
                      <GlassButton variant="ghost" size="sm">
                        Inspect
                      </GlassButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span>Algorithm version 2.1.0 (Zero-hallucination validated)</span>
            <Link href="/placement/compare" className="text-accent hover:underline font-medium">
              Run Batch Matrix Comparison →
            </Link>
          </div>
        </GlassCard>

        {/* Bento 2: Campus Skill Gap Distribution (Span 5) */}
        <GlassCard
          variant="surface"
          padding="md"
          className="col-span-12 lg:col-span-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-title text-text font-bold">Campus Skill Gaps</h3>
              <Link href="/placement/analytics" className="text-caption text-accent hover:underline">
                Full Analytics →
              </Link>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Frequent missing skills across all active recruitment drives.
            </p>

            <div className="space-y-3">
              {mockSkillGapDistribution.slice(0, 4).map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-text">{item.skill}</span>
                    <span className="text-text-muted tabular">
                      {item.affectedStudents} students ({Math.round((item.affectedStudents / stats.totalStudents) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-pill bg-canvas-subtle overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-pill transition-all duration-slow"
                      style={{
                        width: `${Math.round((item.affectedStudents / stats.totalStudents) * 100)}%`,
                        backgroundColor:
                          item.priority === 'high'
                            ? 'var(--ps-danger)'
                            : item.priority === 'medium'
                            ? 'var(--ps-warning)'
                            : 'var(--ps-accent)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle">
            <Link href="/placement/reports" className="w-full block">
              <GlassButton variant="secondary" size="sm" fullWidth>
                Export Department Training Recommendations
              </GlassButton>
            </Link>
          </div>
        </GlassCard>

        {/* Bento 3: Active Placement Drives (Span 6) */}
        <GlassCard
          variant="surface"
          padding="md"
          className="col-span-12 lg:col-span-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-title text-text font-bold">Active Campus Drives</h3>
              <Link href="/placement/jobs" className="text-caption text-accent hover:underline">
                Manage ({mockJobs.length})
              </Link>
            </div>

            <div className="space-y-2.5">
              {activeDrives.map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-md bg-canvas-subtle border border-border-subtle flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-text">{job.title}</h4>
                    <p className="text-xs text-text-muted">{job.company} • {job.salary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <GlassBadge variant="default" size="sm">
                      {job.applicationCount} Applicants
                    </GlassBadge>
                    <Link href="/placement/candidates">
                      <GlassButton variant="secondary" size="sm">
                        Candidates
                      </GlassButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle">
            <Link href="/placement/jobs">
              <GlassButton variant="ghost" size="sm">
                + Create New Drive Specification
              </GlassButton>
            </Link>
          </div>
        </GlassCard>

        {/* Bento 4: Governance & Quality Controls (Span 6) */}
        <GlassCard
          variant="surface"
          padding="md"
          className="col-span-12 lg:col-span-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-title text-text font-bold">AI Screening Quality & Governance</h3>
              <GlassBadge variant="success" size="sm" dot>
                Verified
              </GlassBadge>
            </div>

            <div className="space-y-3 text-xs text-text-muted leading-relaxed">
              <div className="p-3 rounded-md bg-canvas-subtle border border-border-subtle flex items-start gap-2.5">
                <span className="text-success font-bold text-sm">✓</span>
                <div>
                  <strong className="text-text block">Deterministic Eligibility Filter</strong>
                  Backlog counts and CGPA are strictly evaluated before semantic matching.
                </div>
              </div>

              <div className="p-3 rounded-md bg-canvas-subtle border border-border-subtle flex items-start gap-2.5">
                <span className="text-info font-bold text-sm">ℹ</span>
                <div>
                  <strong className="text-text block">Explainability Logs Active</strong>
                  Every candidate ranking exports explicit skill evidence and confidence provenance.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span>WCAG 2.2 AA Audited</span>
            <Link href="/placement/reports" className="text-accent hover:underline font-medium">
              View Audit Log
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
