'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { StatCard } from '@/components/product/StatCard';
import { MatchScore } from '@/components/product/MatchScore';
import { SkillChip } from '@/components/product/SkillChip';
import {
  fetchDashboardData,
  getPrimaryMatch,
  extractSkillGapsFromEvaluations,
  getRecentApplications,
  getRecommendedJobs,
  convertToFrontendStudent,
  convertToFrontendJob,
  convertToFrontendApplication,
} from '@/services/student-api';
import { mapBackendEvaluationToMatchResult } from '@/types/api';
import type { BackendJob, BackendEvaluation } from '@/types/api';
import type { Student, Job, Application, MatchResult, Recommendation } from '@/types';

export default function StudentDashboardPage() {
  const [dashboardData, setDashboardData] = useState<{
    student: Student | null;
    applications: Application[];
    evaluations: BackendEvaluation[];
    backendJobs: BackendJob[];
    frontendJobs: Job[];
    isLoading: boolean;
    error: string | null;
  }>({
    student: null,
    applications: [],
    evaluations: [],
    backendJobs: [],
    frontendJobs: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchDashboardData();
        
        if (result.error) {
          setDashboardData((prev) => ({ ...prev, error: result.error, isLoading: false }));
          return;
        }

        // Convert backend data to frontend types
        const student = result.profile ? convertToFrontendStudent(result.profile) : null;
        const backendJobs = result.jobs?.items || [];
        const frontendJobs = backendJobs.map(convertToFrontendJob);
        const applications = result.applications?.items.map(convertToFrontendApplication) || [];
        const evaluations = result.evaluations?.items || [];

        setDashboardData({
          student,
          applications,
          evaluations,
          backendJobs,
          frontendJobs,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setDashboardData((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to load dashboard data',
          isLoading: false,
        }));
      }
    };

    fetchData();
  }, []);

  // Derived data
  const { student, applications, evaluations, backendJobs, frontendJobs, isLoading, error } = dashboardData;
  const primaryMatch = getPrimaryMatch(evaluations);
  const recommendedJobs = getRecommendedJobs(backendJobs);
  const recentApplications = getRecentApplications(applications);
  const skillGaps = extractSkillGapsFromEvaluations(evaluations);
  const highPriorityGaps = skillGaps.filter((g) => g.priority === 'high');
  
  // Convert recommended backend jobs to frontend jobs for display
  const recommendedFrontendJobs = recommendedJobs.map(convertToFrontendJob);

  // Create MatchResult from the primary evaluation via the shared mapper —
  // hand-rolling it here once shipped empty skill arrays (Bug 1's pattern)
  const matchResult: MatchResult | null = primaryMatch
    ? mapBackendEvaluationToMatchResult(primaryMatch, primaryMatch.jobVersion?.jobId || '')
    : null;

  // Get primary recommendation from skill gaps
  const primaryRecommendation: Recommendation | null = skillGaps.length > 0
    ? {
        id: 'rec-001',
        studentId: student?.id || '',
        jobId: primaryMatch?.jobVersion?.jobId || '',
        skill: highPriorityGaps[0]?.skill || { id: '', name: '', category: '' },
        priority: highPriorityGaps[0]?.priority || 'high',
        currentMatchScore: matchResult?.overallScore || 0,
        projectedMatchScore: (matchResult?.overallScore || 0) + (highPriorityGaps[0]?.potentialMatchImprovement || 0),
        estimatedTimeWeeks: highPriorityGaps[0]?.steps?.length || 5,
        steps: highPriorityGaps[0]?.steps || [],
        resources: [],
      }
    : null;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-text-danger">Error: {error}</p>
          <GlassButton variant="primary" size="sm" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </GlassButton>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-text-muted">No student profile found</p>
        </div>
      </div>
    );
  }

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
          value={recentApplications.length}
          subtext={`${recentApplications.filter((a) => a.status === 'under_review').length} Under Review, ${recentApplications.filter((a) => a.status === 'shortlisted').length} Shortlisted`}
        />
        <StatCard
          label="High Priority Skill Gaps"
          value={highPriorityGaps.length}
          delta={highPriorityGaps.map(g => g.skill.name).join(', ')}
          deltaType="negative"
          subtext="Actionable in 4 weeks"
        />
        <StatCard
          label="Target Roles Eligible"
          value={`${recommendedFrontendJobs.length} of ${frontendJobs.length}`}
          deltaType="positive"
          subtext="Eligibility verified"
        />
      </div>

      {/* Apple Bento Grid Section */}
      <div className="bento-grid">
        {/* Bento Item 1: Top Job Match (Span 7 col) */}
        {recommendedFrontendJobs.length > 0 && matchResult && (
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
                <EligibilityBadge status={matchResult.eligibilityStatus} />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-text hover:text-accent transition-base">
                    <Link href={`/student/jobs/${recommendedFrontendJobs[0].id}`}>
                      {recommendedFrontendJobs[0].title}
                    </Link>
                  </h3>
                  <p className="text-sm text-text-muted">
                    {recommendedFrontendJobs[0].company} • {recommendedFrontendJobs[0].location} ({recommendedFrontendJobs[0].workMode})
                  </p>
                  <div className="mt-2 text-xs font-semibold text-text tabular">
                    {recommendedFrontendJobs[0].salary}
                  </div>
                </div>

                <MatchScore
                  score={matchResult.overallScore}
                  confidence={matchResult.confidenceScore}
                  size="md"
                  showDetails={false}
                />
              </div>

              {/* Match explanation excerpt */}
              <p className="mt-4 text-xs text-text-muted bg-canvas-subtle p-3 rounded-md border border-border-subtle leading-relaxed">
                {matchResult.matchSummary}
              </p>

              {/* Skills breakdown chip preview */}
              <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                <span className="text-caption text-text-faint font-medium mr-1">Matching:</span>
                {matchResult.strongSkills.map((sk) => (
                  <SkillChip key={sk.id} skill={sk} status="strong" size="sm" />
                ))}
                {matchResult.missingSkills.map((sk) => (
                  <SkillChip key={sk.id} skill={sk} status="missing" size="sm" />
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
              <Link href={`/student/match?jobId=${recommendedFrontendJobs[0].id}`}>
                <GlassButton variant="secondary" size="sm">
                  View Full Match Breakdown
                </GlassButton>
              </Link>
              <Link href={`/student/jobs/${recommendedFrontendJobs[0].id}`}>
                <GlassButton variant="primary" size="sm">
                  Apply Now
                </GlassButton>
              </Link>
            </div>
          </GlassCard>
        )}

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
                View All ({skillGaps.length})
              </Link>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Closing these high-impact gaps unlocks up to <strong className="text-success">+{highPriorityGaps.reduce((sum, g) => sum + (g.potentialMatchImprovement || 0), 0)}%</strong> match lift.
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
        {primaryRecommendation && (
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
                Current focus: <strong className="text-text">{primaryRecommendation.skill.name}</strong> fundamentals and CRUD API construction.
              </p>

              {/* Step list */}
              <div className="space-y-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
                {primaryRecommendation.steps.slice(0, 3).map((step, idx) => (
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
              <span>Projected Readiness Lift: {matchResult?.overallScore || 0}% → {primaryRecommendation.projectedMatchScore}%</span>
              <Link href="/student/recommendations" className="text-accent hover:underline font-medium">
                Full Roadmap
              </Link>
            </div>
          </GlassCard>
        )}

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
                View All ({recentApplications.length})
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentApplications.map((app) => {
                const job = frontendJobs.find((j) => j.id === app.jobId);
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
                    <GlassBadge variant={statusBadge} size="sm">
                      {app.status === 'under_review' ? 'Under Review' : app.status === 'shortlisted' ? 'Shortlisted' : app.status === 'applied' ? 'Applied' : app.status}
                    </GlassBadge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
            <span className="text-caption text-text-faint">Resume v{student.resumeUpdatedAt ? '2.1' : '1.0'} active</span>
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
