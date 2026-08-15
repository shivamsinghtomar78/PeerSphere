'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { StatCard } from '@/components/product/StatCard';
import { MatchScore } from '@/components/product/MatchScore';
import { SkillChip } from '@/components/product/SkillChip';
import { currentStudent } from '@/data/students';
import { mockJobs } from '@/data/jobs';
import { mockApplications, mockSkillGaps, mockRecommendations, mockMatchResults } from '@/data/index';

export default function StudentDashboardPage() {
  const student = currentStudent;
  const primaryMatch = mockMatchResults[0]; // e.g. for ABC Tech backend role
  const recommendedJobs = mockJobs.slice(0, 3);
  const highPriorityGaps = mockSkillGaps.filter((g) => g.priority === 'high');

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Welcome back, {student.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {student.department} • {student.program} (Year {student.year}) • CGPA: {student.cgpa}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/student/profile">
            <GlassButton variant="secondary" size="sm">
              Update Resume
            </GlassButton>
          </Link>
          <Link href="/student/jobs">
            <GlassButton variant="primary" size="sm">
              Explore Placements
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Top Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Placement Readiness"
          value={`${student.placementReadiness}%`}
          delta="Ready for Tier 1"
          deltaType="positive"
          subtext="Target: 85%+"
        />
        <StatCard
          label="Active Applications"
          value={mockApplications.length}
          subtext="1 Under Review, 1 Shortlisted"
        />
        <StatCard
          label="High Priority Skill Gaps"
          value={highPriorityGaps.length}
          delta="Spring Boot, REST API"
          deltaType="negative"
          subtext="Actionable in 4 weeks"
        />
        <StatCard
          label="Target Roles Eligible"
          value="4 of 5"
          deltaType="positive"
          subtext="Eligibility verified"
        />
      </div>

      {/* Apple Bento Grid Section */}
      <div className="bento-grid">
        {/* Bento Item 1: Top Job Match (Span 7 col) */}
        <GlassCard
          variant="surface"
          padding="md"
          className="col-span-12 lg:col-span-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-caption font-semibold uppercase tracking-wider text-accent">
                Top Recommendation
              </span>
              <EligibilityBadge status={primaryMatch.eligibilityStatus} />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-text hover:text-accent transition-base">
                  <Link href={`/student/jobs/${recommendedJobs[0].id}`}>
                    {recommendedJobs[0].title}
                  </Link>
                </h3>
                <p className="text-sm text-text-muted">
                  {recommendedJobs[0].company} • {recommendedJobs[0].location} ({recommendedJobs[0].workMode})
                </p>
                <div className="mt-2 text-xs font-semibold text-text tabular">
                  {recommendedJobs[0].salary}
                </div>
              </div>

              <MatchScore
                score={primaryMatch.overallScore}
                confidence={primaryMatch.confidenceScore}
                size="md"
                showDetails={false}
              />
            </div>

            {/* Match explanation excerpt */}
            <p className="mt-4 text-xs text-text-muted bg-canvas-subtle p-3 rounded-md border border-border-subtle leading-relaxed">
              {primaryMatch.matchSummary}
            </p>

            {/* Skills breakdown chip preview */}
            <div className="mt-4 flex flex-wrap gap-1.5 items-center">
              <span className="text-caption text-text-faint font-medium mr-1">Matching:</span>
              {primaryMatch.strongSkills.map((sk) => (
                <SkillChip key={sk.id} skill={sk} status="strong" size="sm" />
              ))}
              {primaryMatch.missingSkills.map((sk) => (
                <SkillChip key={sk.id} skill={sk} status="missing" size="sm" />
              ))}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
            <Link href={`/student/match?jobId=${recommendedJobs[0].id}`}>
              <GlassButton variant="secondary" size="sm">
                View Full Match Breakdown
              </GlassButton>
            </Link>
            <Link href={`/student/jobs/${recommendedJobs[0].id}`}>
              <GlassButton variant="primary" size="sm">
                Apply Now
              </GlassButton>
            </Link>
          </div>
        </GlassCard>

        {/* Bento Item 2: Skill Gaps Action Summary (Span 5 col) */}
        <GlassCard
          variant="surface"
          padding="md"
          className="col-span-12 lg:col-span-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-title text-text font-bold">Skill Gaps to Close</h3>
              <Link href="/student/skill-gaps" className="text-caption text-accent hover:underline">
                View All ({mockSkillGaps.length})
              </Link>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Closing these high-impact gaps unlocks up to <strong className="text-success">+22%</strong> match lift.
            </p>

            <div className="space-y-3">
              {highPriorityGaps.map((gap, i) => (
                <div
                  key={i}
                  className="p-3 rounded-md bg-canvas-subtle border border-border-subtle flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <SkillChip skill={gap.skill} status="missing" size="sm" />
                      <GlassBadge variant="danger" size="sm">
                        High
                      </GlassBadge>
                    </div>
                    <p className="text-xs text-text-muted mt-1 line-clamp-1">{gap.recommendation}</p>
                  </div>
                  {gap.potentialMatchImprovement && (
                    <span className="text-caption font-bold text-success tabular shrink-0">
                      +{gap.potentialMatchImprovement}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle">
            <Link href="/student/recommendations" className="w-full block">
              <GlassButton variant="secondary" size="sm" fullWidth>
                Generate Milestone Roadmap →
              </GlassButton>
            </Link>
          </div>
        </GlassCard>

        {/* Bento Item 3: Active Improvement Roadmap (Span 6 col) */}
        <GlassCard
          variant="surface"
          padding="md"
          className="col-span-12 lg:col-span-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-title text-text font-bold">Active Improvement Track</h3>
              <GlassBadge variant="accent" size="sm">
                Week 2 of 5
              </GlassBadge>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Current focus: <strong className="text-text">{mockRecommendations[0].skill.name}</strong> fundamentals and CRUD API construction.
            </p>

            {/* Step list */}
            <div className="space-y-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
              {mockRecommendations[0].steps.slice(0, 3).map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 relative z-10">
                  <span className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-accent shrink-0 tabular">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-text font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span>Projected Readiness Lift: 72% → 86%</span>
            <Link href="/student/recommendations" className="text-accent hover:underline font-medium">
              Full Roadmap
            </Link>
          </div>
        </GlassCard>

        {/* Bento Item 4: Application Pipeline (Span 6 col) */}
        <GlassCard
          variant="surface"
          padding="md"
          className="col-span-12 lg:col-span-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-title text-text font-bold">Recent Applications</h3>
              <Link href="/student/applications" className="text-caption text-accent hover:underline">
                View All ({mockApplications.length})
              </Link>
            </div>

            <div className="space-y-2.5">
              {mockApplications.map((app) => {
                const job = mockJobs.find((j) => j.id === app.jobId);
                if (!job) return null;
                const statusBadge =
                  app.status === 'shortlisted' ? 'success' : app.status === 'under_review' ? 'warning' : 'default';

                return (
                  <div
                    key={app.id}
                    className="p-3 rounded-md bg-canvas-subtle border border-border-subtle flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-text">{job.title}</h4>
                      <p className="text-xs text-text-muted">{job.company}</p>
                    </div>
                    <GlassBadge variant={statusBadge as any} size="sm">
                      {app.status === 'under_review' ? 'Under Review' : app.status === 'shortlisted' ? 'Shortlisted' : 'Applied'}
                    </GlassBadge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
            <span className="text-caption text-text-faint">Resume v2.1 active</span>
            <Link href="/student/jobs">
              <GlassButton variant="ghost" size="sm">
                Search More Openings →
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
