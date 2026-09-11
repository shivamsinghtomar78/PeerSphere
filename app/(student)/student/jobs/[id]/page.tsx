'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ClayButton } from '@/components/ui/ClayButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore } from '@/components/product/MatchScore';
import { SkillChip } from '@/components/product/SkillChip';
import { ResumeComparison } from '@/components/product/ResumeComparison';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  fetchJobById,
  fetchMyProfile,
  fetchMyApplications,
  fetchMyEvaluations,
  applyToJob,
  convertToFrontendJobDetail,
  convertToFrontendStudent,
  convertToFrontendApplication,
} from '@/services/student-api';
import { mapBackendEvaluationToMatchResult } from '@/types/api';
import type { BackendEvaluation } from '@/types/api';
import { formatDate } from '@/lib/utils';
import type { Job, Student, Application, MatchResult } from '@/types';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [evaluations, setEvaluations] = useState<BackendEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;

    const fetchData = async () => {
      if (!jobId) return;

      try {
        setIsLoading(true);
        setError(null);

        const [jobResult, profileResult, appsResult, evalsResult] = await Promise.all([
          fetchJobById(jobId),
          fetchMyProfile(),
          fetchMyApplications({ pageSize: 50 }),
          fetchMyEvaluations(),
        ]);
        if (stale) return;

        const frontendJob = convertToFrontendJobDetail(jobResult);
        const frontendStudent = convertToFrontendStudent(profileResult);
        const frontendApps = appsResult.items.map(convertToFrontendApplication);

        setJob(frontendJob);
        setStudent(frontendStudent);
        setApplications(frontendApps);
        setEvaluations(evalsResult?.items || []);
        setIsLoading(false);
      } catch (err) {
        if (stale) return;
        setError(err instanceof Error ? err.message : 'Failed to load job details');
        setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      stale = true;
    };
  }, [jobId]);

  const applied = applications.some((a) => a.jobId === jobId);
  const application = applications.find((a) => a.jobId === jobId);

  // Prefer the application's stored result, else the student's standing
  // evaluation for this job (evaluations exist independent of applying).
  // No synthetic zeros: an unevaluated pair is "not evaluated", not "0%".
  const jobEvaluation = evaluations.find((e) => e.jobVersion?.jobId === jobId);
  const matchResult: MatchResult | null =
    application?.matchResult ||
    (jobEvaluation ? mapBackendEvaluationToMatchResult(jobEvaluation, jobId) : null);

  // Check eligibility
  const isEligible = (
    job &&
    student &&
    (student.cgpa >= (job.eligibility.minCgpa || 0)) &&
    student.activeBacklogs <= (job.eligibility.maxBacklogs || 0) &&
    job.eligibility.allowedDepartments.includes(student.department) &&
    job.eligibility.allowedPrograms.includes(student.program)
  );

  const eligibilityStatus = (isEligible ? 'eligible' : 'ineligible') as MatchResult['eligibilityStatus'];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <p className="text-text-danger">Error: {error}</p>
          <button onClick={() => router.back()} className="text-accent hover:underline mt-2">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <p className="text-text-muted">Job not found</p>
          <Link href="/student/jobs" className="text-accent hover:underline">
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  const handleApply = async () => {
    try {
      const newApp = await applyToJob(jobId);
      const frontendApp = convertToFrontendApplication(newApp);
      setApplications([...applications, frontendApp]);
      toast('Application submitted successfully!', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to submit application', 'error');
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href="/student/jobs"
        className="inline-flex items-center gap-1.5 text-caption text-text-muted hover:text-text transition-base"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Placement Drives
      </Link>

      {/* Main Job Hero Card */}
      <GlassCard variant="surface" padding="lg" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <span className="text-caption font-semibold uppercase tracking-wider text-text-muted">
              {job.company}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text mt-1">
              {job.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-sm text-text-muted">
              <span>{job.location}</span>
              <span>•</span>
              <span className="capitalize">{job.workMode}</span>
              <span>•</span>
              <span className="capitalize">{job.jobType}</span>
              {job.salary && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-text tabular">{job.salary}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {matchResult ? (
              <MatchScore
                score={matchResult.overallScore}
                confidence={matchResult.confidenceScore}
                eligibility={eligibilityStatus}
                size="lg"
              />
            ) : (
              <div className="flex flex-col items-end gap-1.5">
                <GlassBadge variant="muted" size="md">Not evaluated yet</GlassBadge>
                <span className="text-caption text-text-faint text-right max-w-[180px]">
                  The engine has not scored your profile against this drive.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-caption text-text-muted">
            <EligibilityBadge status={eligibilityStatus} />
            <span>Deadline: <strong className="text-text">{formatDate(job.deadline)}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/student/match?jobId=${job.id}`}>
              <GlassButton variant="secondary" size="md">
                Detailed Match Breakdown
              </GlassButton>
            </Link>
            <ClayButton
              variant={applied ? 'neutral' : 'accent'}
              size="md"
              disabled={applied}
              onClick={handleApply}
            >
              {applied ? 'Application Submitted ✓' : 'Apply for Role'}
            </ClayButton>
          </div>
        </div>
      </GlassCard>

      {/* Role Description & Requirements Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Responsibilities */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard variant="surface" padding="md" className="space-y-4">
            <h2 className="text-title font-bold text-text">About the Role</h2>
            <p className="text-sm text-text-muted leading-relaxed">{job.description}</p>

            {job.responsibilities && job.responsibilities.length > 0 && (
              <>
                <h3 className="text-title font-bold text-text pt-2">Key Responsibilities</h3>
                <ul className="space-y-2 list-disc list-inside text-sm text-text-muted">
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} className="leading-relaxed">
                      <span className="text-text">{resp}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </GlassCard>

          {/* Skill Requirements */}
          <GlassCard variant="surface" padding="md" className="space-y-4">
            <h2 className="text-title font-bold text-text">Skill Requirements</h2>

            <div>
              <div className="text-caption text-text-faint font-semibold uppercase tracking-wider mb-2">
                Mandatory Skills
              </div>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((sk) => (
                  <SkillChip key={sk.id} skill={sk} size="md" />
                ))}
              </div>
            </div>

            {job.preferredSkills && job.preferredSkills.length > 0 && (
              <div className="pt-2 border-t border-border-subtle">
                <div className="text-caption text-text-faint font-semibold uppercase tracking-wider mb-2">
                  Preferred / Nice-to-Have Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.preferredSkills.map((sk) => (
                    <SkillChip key={sk.id} skill={sk} size="md" />
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Matrix comparison — only for a real evaluation; a synthetic
              all-missing matrix would misstate skills the student has */}
          {student && matchResult ? (
            <ResumeComparison
              job={job}
              student={student}
              matchResult={matchResult}
            />
          ) : (
            <GlassCard variant="surface" padding="md" className="space-y-2">
              <h2 className="text-title font-bold text-text">Resume vs Requirements</h2>
              <p className="text-sm text-text-muted">
                This drive has not been evaluated against your profile yet, so no
                per-skill evidence is available.
              </p>
              <Link href={`/student/match?jobId=${jobId}`} className="inline-block">
                <GlassButton variant="secondary" size="sm">
                  Run match analysis →
                </GlassButton>
              </Link>
            </GlassCard>
          )}
        </div>

        {/* Right 1 Col: Eligibility Criteria */}
        <div className="space-y-6">
          <GlassCard variant="surface" padding="md" className="space-y-4">
            <h2 className="text-title font-bold text-text">Eligibility Criteria</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-text-muted">Min CGPA</span>
                <span className="font-semibold text-text tabular">{job.eligibility.minCgpa} (Your: {student?.cgpa || 0})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-text-muted">Allowed Depts</span>
                <span className="font-semibold text-text text-right text-xs max-w-[150px]">
                  {job.eligibility.allowedDepartments.join(', ')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-text-muted">Allowed Programs</span>
                <span className="font-semibold text-text">{job.eligibility.allowedPrograms.join(', ')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-text-muted">Max Backlogs</span>
                <span className="font-semibold text-text tabular">{job.eligibility.maxBacklogs}</span>
              </div>
            </div>

            <div className="pt-2">
              {isEligible ? (
                <GlassBadge variant="success" size="md" className="w-full justify-center">
                  ✓ You Meet All Eligibility Criteria
                </GlassBadge>
              ) : (
                <GlassBadge variant="danger" size="md" className="w-full justify-center">
                  ✗ You Do Not Meet All Criteria
                </GlassBadge>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
