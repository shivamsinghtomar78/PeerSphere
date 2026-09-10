'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore, ConfidenceBadge } from '@/components/product/MatchScore';
import { SkillChip, SkillStatusLegend } from '@/components/product/SkillChip';
import { ResumeComparison } from '@/components/product/ResumeComparison';
import { HumanReviewBanner } from '@/components/product/HumanReviewBanner';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchJobs,
  fetchMyProfile,
  fetchMyEvaluations,
  queueEvaluation,
  convertToFrontendStudent,
  convertToFrontendJob,
  getPrimaryMatch,
} from '@/services/student-api';
import { mapBackendEvaluationToMatchResult } from '@/types/api';
import type { BackendJob, BackendEvaluation, BackendStudent } from '@/types/api';
import type { Job, Student, MatchResult } from '@/types';

export default function MatchAnalysisPage() {
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [evaluations, setEvaluations] = useState<BackendEvaluation[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, evaluationsData, profileData] = await Promise.all([
          fetchJobs({ pageSize: 20, status: 'PUBLISHED' }),
          fetchMyEvaluations(),
          fetchMyProfile(),
        ]);

        const backendJobs = jobsData?.items || [];
        const backendEvaluations = evaluationsData?.items || [];
        const frontendStudent = profileData ? convertToFrontendStudent(profileData) : null;

        setJobs(backendJobs);
        setEvaluations(backendEvaluations);
        setStudent(frontendStudent);

        // Honour a ?jobId= deep link (job detail's "Detailed Match Breakdown"
        // navigates here); fall back to the first published job.
        if (backendJobs.length > 0) {
          const requestedJobId = new URLSearchParams(window.location.search).get('jobId');
          const requestedJob = requestedJobId
            ? backendJobs.find((j) => j.jobId === requestedJobId)
            : undefined;
          setSelectedJobId(requestedJob ? requestedJob.jobId : backendJobs[0].jobId);
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load match data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get selected job and match result
  const selectedJob = jobs.find((j) => j.jobId === selectedJobId);
  const frontendJobs = jobs.map(convertToFrontendJob);

  // Find evaluation for selected job
  const selectedEvaluation = evaluations.find((e) => e.jobVersion?.jobId === selectedJobId);

  // Create MatchResult from evaluation — the shared mapper splits
  // requirementMatches into strong/partial/missing skill evidence.
  const matchResult: MatchResult | null = selectedEvaluation
    ? mapBackendEvaluationToMatchResult(
        selectedEvaluation,
        selectedEvaluation.jobVersion?.jobId || selectedJobId
      )
    : null;

  // If we have jobs but no evaluation for selected job, try to queue one
  const canQueueEvaluation = selectedJob && !selectedEvaluation && student;

  const handleQueueEvaluation = async () => {
    if (!selectedJob || !student) return;

    try {
      await queueEvaluation(student.id, selectedJob.jobId);
      // Refresh evaluations
      const evals = await fetchMyEvaluations();
      setEvaluations(evals?.items || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to queue evaluation';
      setError(message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <LoadingState label="Loading match analysis..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <ErrorState title="Failed to load match analysis" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!student || jobs.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <EmptyState
          title="No data available"
          description={!student ? 'Student profile not found' : 'No published jobs available for matching'}
        />
      </div>
    );
  }

  // If no job is selected but we have jobs, select the first one
  if (!selectedJob && jobs.length > 0) {
    setSelectedJobId(jobs[0].jobId);
    return null; // Re-render with selected job
  }

  if (!selectedJob) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <EmptyState
          title="No jobs available"
          description="There are no published jobs to analyze match scores for."
        />
      </div>
    );
  }

  const frontendSelectedJob = convertToFrontendJob(selectedJob);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            AI Match & Gap Analysis
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Explainable AI comparison between your verified profile/resume and target placement job requirements.
          </p>
        </div>

        {/* Job Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="job-select" className="text-caption text-text-muted font-medium whitespace-nowrap">
            Analyzing Target:
          </label>
          <select
            id="job-select"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="h-10 px-3 py-2 rounded-sm border border-border bg-surface text-text text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
          >
            {frontendJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} — {job.company}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Human review caveat banner if flagged and we have a match result */}
      {matchResult && matchResult.requiresHumanReview && (
        <HumanReviewBanner note={matchResult.humanReviewNote} />
      )}

      {/* If no evaluation exists for this job, show option to queue one */}
      {!matchResult && canQueueEvaluation && (
        <GlassCard variant="surface-raised" padding="md" className="bg-accent-light/20 border-accent/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-title font-bold text-text">No Match Analysis Available</h3>
              <p className="text-sm text-text-muted mt-1">
                Queue an AI evaluation to compare your profile against {frontendSelectedJob.title} requirements.
              </p>
            </div>
            <GlassButton variant="primary" size="sm" onClick={handleQueueEvaluation}>
              Run Match Analysis
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {matchResult && (
        <>
          {/* Overview Stat Bento Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard variant="surface" padding="lg" className="flex flex-col items-center justify-center text-center">
              <span className="text-caption text-text-muted font-semibold uppercase tracking-wider mb-2">
                Overall AI Match Score
              </span>
              <MatchScore
                score={matchResult.overallScore}
                size="lg"
                showDetails={false}
              />
              <div className="mt-3 flex items-center gap-2">
                <EligibilityBadge status={matchResult.eligibilityStatus} />
              </div>
              <p className="text-xs text-text-faint mt-2">
                Evaluated on {matchResult.analysisVersion} model
              </p>
            </GlassCard>

            <GlassCard variant="surface" padding="lg" className="flex flex-col justify-between">
              <div>
                <span className="text-caption text-text-muted font-semibold uppercase tracking-wider">
                  Confidence & Evidence
                </span>
                <div className="mt-3">
                  <ConfidenceBadge confidence={matchResult.confidenceScore} />
                </div>
                <p className="text-sm text-text-muted mt-3 leading-relaxed">
                  {matchResult.matchSummary || 'No summary available'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
                <span>Skill Coverage: <strong className="text-text">{matchResult.coveragePercent}%</strong></span>
                <span>Zero Hallucination Gate ✓</span>
              </div>
            </GlassCard>

            <GlassCard variant="surface" padding="lg" className="flex flex-col justify-between">
              <div>
                <span className="text-caption text-text-muted font-semibold uppercase tracking-wider">
                  Skill Alignment Summary
                </span>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-success font-medium">Strong Skills</span>
                    <span className="font-bold text-text tabular">{matchResult.strongSkills.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warning font-medium">Partial Knowledge</span>
                    <span className="font-bold text-text tabular">{matchResult.partialSkills.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-danger font-medium">Missing Skills</span>
                    <span className="font-bold text-text tabular">{matchResult.missingSkills.length}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-subtle">
                <Link href="/student/skill-gaps" className="w-full block">
                  <GlassButton variant="primary" size="sm" fullWidth>
                    Inspect Skill Gaps →
                  </GlassButton>
                </Link>
              </div>
            </GlassCard>
          </div>

          {/* Skill Breakdown Categories */}
          <GlassCard variant="surface" padding="md" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-title font-bold text-text">Skill Match Categorization</h2>
              <SkillStatusLegend />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Strong Matches */}
              <div className="p-4 rounded-lg bg-canvas-subtle border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-success flex items-center gap-1.5">
                    <span>✓</span> Strong Matches
                  </span>
                  <GlassBadge variant="success" size="sm">
                    {matchResult.strongSkills.length}
                  </GlassBadge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.strongSkills.length > 0 ? (
                    matchResult.strongSkills.map((sk) => (
                      <SkillChip key={sk.id} skill={sk} status="strong" size="sm" />
                    ))
                  ) : (
                    <span className="text-caption text-text-faint">No strong matches</span>
                  )}
                </div>
              </div>

              {/* Partial Matches */}
              <div className="p-4 rounded-lg bg-canvas-subtle border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-warning flex items-center gap-1.5">
                    <span>⚠</span> Partial Matches
                  </span>
                  <GlassBadge variant="warning" size="sm">
                    {matchResult.partialSkills.length}
                  </GlassBadge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.partialSkills.length > 0 ? (
                    matchResult.partialSkills.map((sk) => (
                      <SkillChip key={sk.id} skill={sk} status="partial" size="sm" />
                    ))
                  ) : (
                    <span className="text-caption text-text-faint">No partial matches</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="p-4 rounded-lg bg-canvas-subtle border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-danger flex items-center gap-1.5">
                    <span>✕</span> Missing Gaps
                  </span>
                  <GlassBadge variant="danger" size="sm">
                    {matchResult.missingSkills.length}
                  </GlassBadge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.missingSkills.length > 0 ? (
                    matchResult.missingSkills.map((sk) => (
                      <SkillChip key={sk.id} skill={sk} status="missing" size="sm" />
                    ))
                  ) : (
                    <span className="text-caption text-text-faint">No missing gaps</span>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Complete Matrix Comparison */}
          <ResumeComparison
            job={frontendSelectedJob}
            student={student}
            matchResult={matchResult}
          />
        </>
      )}
    </div>
  );
}
