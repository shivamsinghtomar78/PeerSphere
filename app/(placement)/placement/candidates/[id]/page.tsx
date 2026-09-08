'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore, ConfidenceBadge } from '@/components/product/MatchScore';
import { ResumeComparison } from '@/components/product/ResumeComparison';
import { SkillChip } from '@/components/product/SkillChip';
import { HumanReviewBanner } from '@/components/product/HumanReviewBanner';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import { useToast } from '@/components/ui/Toast';
import { GlassDialog } from '@/components/ui/GlassDialog';
import { ClayButton } from '@/components/ui/ClayButton';
import {
  fetchStudentById,
  fetchJobById,
  fetchAllApplications,
  updateApplicationStatus,
  convertToFrontendStudent,
  convertToFrontendJobDetail,
  createOverride,
  fetchEvaluationOverrides,
  type EvaluationOverride,
} from '@/services/placement-api';
import { mapBackendEvaluationToMatchResult } from '@/types/api';
import type { BackendStudent, BackendJob, BackendEvaluation, BackendApplication } from '@/types/api';
import type { Student, Job, Candidate, MatchResult } from '@/types';
import { formatCgpa } from '@/lib/utils';

export default function CandidateDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const { toast } = useToast();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Override state (admin decision trail for the latest evaluation)
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<EvaluationOverride[]>([]);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState<EvaluationOverride['decision']>('shortlist');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      try {
        const backendStudent = await fetchStudentById(studentId);
        setStudent(convertToFrontendStudent(backendStudent));

        const appsData = await fetchAllApplications({ pageSize: 100 }); // API caps pageSize at 100
        const studentApps = appsData?.items
          .filter((a) => a.studentId === studentId)
          .sort(
            (a, b) =>
              new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          );

        // Prefer the newest application that HAS an evaluation — the page's
        // purpose is reviewing the evaluation; fall back to the newest overall.
        const app =
          studentApps?.find((a) => a.latestEvaluation) ?? studentApps?.[0];
        if (app) {
          setApplicationId(app.id);
          setShortlisted(app.status === 'SHORTLISTED');

          const jobId = app.jobId;
          const backendJob = await fetchJobById(jobId);
          if (backendJob) setJob(convertToFrontendJobDetail(backendJob));

          const evalData =
            (app.latestEvaluation as BackendEvaluation | null | undefined) ?? null;
          if (evalData) {
            setMatchResult(mapBackendEvaluationToMatchResult(evalData, jobId));
            setEvaluationId(evalData.id);
            // Override history is decision-support context — load alongside
            fetchEvaluationOverrides(evalData.id)
              .then(setOverrides)
              .catch(() => setOverrides([]));
          }
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load candidate details');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const handleOverrideSubmit = async () => {
    if (!evaluationId || !overrideReason.trim()) return;
    try {
      setOverrideSubmitting(true);
      await createOverride(evaluationId, overrideDecision, overrideReason.trim());
      const history = await fetchEvaluationOverrides(evaluationId);
      setOverrides(history);
      setOverrideOpen(false);
      setOverrideReason('');
      toast('Override recorded', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to record override', 'error');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const handleShortlistToggle = async () => {
    if (!applicationId) return;
    const nowShortlisted = !shortlisted;
    try {
      setIsUpdating(true);
      await updateApplicationStatus(applicationId, nowShortlisted ? 'SHORTLISTED' : 'APPLIED');
      setShortlisted(nowShortlisted);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update shortlist';
      toast(message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!studentId) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <EmptyState
          title="No candidate ID"
          description="Please provide a valid candidate ID."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <LoadingState label="Loading candidate details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <ErrorState title="Failed to load candidate" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!student) {
    notFound();
  }

  if (!job) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <EmptyState
          title="No job found for candidate"
          description="This candidate has not applied to any jobs yet."
        />
      </div>
    );
  }

  // If no match result, create a default one
  const displayMatchResult = matchResult || {
    jobId: job.id,
    studentId: student.id,
    overallScore: 0,
    confidenceScore: 0,
    eligibilityStatus: 'pending' as const,
    coveragePercent: 0,
    strongSkills: [],
    partialSkills: [],
    missingSkills: [],
    matchSummary: '',
    analysisVersion: '2.1.0',
    generatedAt: new Date().toISOString(),
    requiresHumanReview: false,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href="/placement/candidates"
        className="inline-flex items-center gap-1.5 text-caption text-text-muted hover:text-text transition-base"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Candidate Rankings
      </Link>

      {/* Flagged Review Warning */}
      {displayMatchResult.requiresHumanReview && (
        <HumanReviewBanner note={displayMatchResult.humanReviewNote} />
      )}

      {/* Candidate Hero Card */}
      <GlassCard variant="surface" padding="lg" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
                {student.name}
              </h1>
              <EligibilityBadge status={displayMatchResult.eligibilityStatus} />
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-sm text-text-muted">
              <span>{student.rollNumber}</span>
              <span>•</span>
              <span>{student.department} ({student.program})</span>
              <span>•</span>
              <span>CGPA: <strong className="text-text tabular">{formatCgpa(student.cgpa)}</strong></span>
              <span>•</span>
              <span>Active Backlogs: <strong className="text-text tabular">{student.activeBacklogs}</strong></span>
            </div>
          </div>

          <div className="shrink-0">
            <MatchScore
              score={displayMatchResult.overallScore}
              confidence={displayMatchResult.confidenceScore}
              size="lg"
            />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ConfidenceBadge confidence={displayMatchResult.confidenceScore} />
            <span className="text-caption text-text-faint">
              Evaluated against: {job.title} ({job.company})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <GlassButton variant="secondary" size="md" onClick={() => window.print()}>
              Download Candidate PDF
            </GlassButton>
            {evaluationId && (
              <GlassButton variant="secondary" size="md" onClick={() => setOverrideOpen(true)}>
                Override Decision
              </GlassButton>
            )}
            <ClayButton
              variant={shortlisted ? 'neutral' : 'accent'}
              size="md"
              onClick={handleShortlistToggle}
              disabled={isUpdating || !applicationId}
            >
              {shortlisted ? 'Shortlisted ✓' : 'Add to Official Shortlist'}
            </ClayButton>
          </div>
        </div>
      </GlassCard>

      {/* Override history (append-only decision trail) */}
      {overrides.length > 0 && (
        <GlassCard variant="surface" padding="md" className="space-y-3">
          <h2 className="text-title font-bold text-text">Override History</h2>
          <ul className="space-y-2">
            {overrides.map((o) => (
              <li
                key={o.id}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm border-b border-border-subtle pb-2 last:border-0"
              >
                <GlassBadge variant={o.decision === 'reject' ? 'danger' : o.decision === 'shortlist' ? 'success' : 'default'} size="sm">
                  {o.decision}
                </GlassBadge>
                <span className="text-text flex-1">{o.reason}</span>
                <span className="text-caption text-text-faint whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Override dialog */}
      <GlassDialog
        open={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        title="Override Evaluation Decision"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Overrides are append-only and audited. A reason is required.
          </p>
          <div className="space-y-1">
            <label htmlFor="override-decision" className="text-sm font-medium text-text-muted block">
              Decision
            </label>
            <select
              id="override-decision"
              value={overrideDecision}
              onChange={(e) => setOverrideDecision(e.target.value as EvaluationOverride['decision'])}
              className="w-full h-10 px-3 text-sm rounded-sm border border-border bg-surface text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
            >
              <option value="shortlist">Shortlist</option>
              <option value="reject">Reject</option>
              <option value="review">Needs further review</option>
              <option value="promote">Promote</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="override-reason" className="text-sm font-medium text-text-muted block">
              Reason (required)
            </label>
            <textarea
              id="override-reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={3}
              placeholder="e.g. Strong practical portfolio despite low keyword coverage"
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-surface text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <GlassButton variant="ghost" onClick={() => setOverrideOpen(false)}>
              Cancel
            </GlassButton>
            <ClayButton
              onClick={handleOverrideSubmit}
              disabled={overrideSubmitting || !overrideReason.trim()}
              loading={overrideSubmitting}
            >
              Record Override
            </ClayButton>
          </div>
        </div>
      </GlassDialog>

      {/* Breakdown Matrix */}
      <div className="space-y-6">
        {/* Skills Section */}
        <GlassCard variant="surface" padding="md" className="space-y-4">
          <h2 className="text-title font-bold text-text">Skill Matching Categorization</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-canvas-subtle border border-border-subtle space-y-2">
              <span className="text-caption font-bold text-success uppercase tracking-wider block">
                Strong Matches ({displayMatchResult.strongSkills.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {displayMatchResult.strongSkills.map((sk) => (
                  <SkillChip key={sk.id} skill={sk} status="strong" size="sm" />
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-canvas-subtle border border-border-subtle space-y-2">
              <span className="text-caption font-bold text-warning uppercase tracking-wider block">
                Partial Matches ({displayMatchResult.partialSkills.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {displayMatchResult.partialSkills.length > 0 ? (
                  displayMatchResult.partialSkills.map((sk) => (
                    <SkillChip key={sk.id} skill={sk} status="partial" size="sm" />
                  ))
                ) : (
                  <span className="text-caption text-text-faint">No partial matches</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-canvas-subtle border border-border-subtle space-y-2">
              <span className="text-caption font-bold text-danger uppercase tracking-wider block">
                Identified Gaps ({displayMatchResult.missingSkills.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {displayMatchResult.missingSkills.length > 0 ? (
                  displayMatchResult.missingSkills.map((sk) => (
                    <SkillChip key={sk.id} skill={sk} status="missing" size="sm" />
                  ))
                ) : (
                  <span className="text-caption text-success font-medium">None</span>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Matrix Comparison */}
        <ResumeComparison
          job={job}
          student={student}
          matchResult={displayMatchResult}
        />
      </div>
    </div>
  );
}
