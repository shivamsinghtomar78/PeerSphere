'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore } from '@/components/product/MatchScore';
import { SkillChip } from '@/components/product/SkillChip';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchAllJobs,
  fetchCandidatesForJob,
  convertToFrontendJob,
  getTopCandidates,
} from '@/services/placement-api';
import type { BackendJob } from '@/types/api';
import type { Candidate } from '@/types';
import { formatCgpa } from '@/lib/utils';

export default function CandidateComparisonPage() {
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        // The comparison grid is built entirely from candidates of the
        // selected drive — the old fetchAllStudents call fed unused state.
        const jobsData = await fetchAllJobs({ pageSize: 20, status: 'PUBLISHED' });
        if (cancelled) return;

        const backendJobs = jobsData?.items || [];
        setJobs(backendJobs);

        // Honour the drive the officer came from (?jobId= on the ranking's
        // Compare button); otherwise probe for the first drive that actually
        // has candidates (a freshly published drive has none and would
        // dead-end the comparison view).
        const requestedJobId = new URLSearchParams(window.location.search).get('jobId');
        const probeOrder = backendJobs.some((j) => j.jobId === requestedJobId)
          ? [
              ...backendJobs.filter((j) => j.jobId === requestedJobId),
              ...backendJobs.filter((j) => j.jobId !== requestedJobId).slice(0, 4),
            ]
          : backendJobs.slice(0, 5);
        for (const backendJob of probeOrder) {
          const candidatesData = await fetchCandidatesForJob(backendJob.jobId);
          if (cancelled) return;
          if (candidatesData.length > 0) {
            setSelectedJobId(backendJob.jobId);
            setCandidates(getTopCandidates(candidatesData, 3));
            break;
          }
        }

        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load comparison data');
        setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <LoadingState label="Loading comparison..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <ErrorState title="Failed to load comparison" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const frontendJobs = jobs.map(convertToFrontendJob);
  // The comparison criteria must belong to the drive the candidates came from
  const targetJob = frontendJobs.find((j) => j.id === selectedJobId) || frontendJobs[0] || null;
  const compareStudents = candidates.map((c) => c.student);

  if (!targetJob || compareStudents.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <EmptyState
          title="No data available for comparison"
          description="There are no jobs or candidates to compare."
        />
      </div>
    );
  }

  // Extract comparison skills from job requirements or use common skills
  const comparisonSkills =
    targetJob.requiredSkills.length > 0
      ? targetJob.requiredSkills.map((s) => s.name)
      : [
          'Java',
          'Spring Boot',
          'REST API',
          'SQL',
          'Data Structures & Algorithms',
          'Git',
        ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Side-by-Side Candidate Comparison
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Compare candidate profiles, skill match breakdowns, and eligibility for <strong className="text-text">{targetJob.title} at {targetJob.company}</strong>.
          </p>
        </div>

        <GlassButton href="/placement/candidates" variant="secondary" size="md">
          ← Back to All Candidates
        </GlassButton>
      </div>

      {/* Comparison Matrix Table */}
      <GlassCard variant="surface" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" role="table">
            <thead className="bg-surface-raised border-b border-border-subtle">
              <tr>
                <th className="py-4 px-4 font-semibold text-text-muted w-1/4">Evaluation Attribute</th>
                {compareStudents.map((stu) => {
                  const candidate = candidates.find((c) => c.student.id === stu.id);
                  return (
                    <th key={stu.id} className="py-4 px-4 font-bold text-text w-1/4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-base text-text">{stu.name}</div>
                          <div className="text-caption text-text-muted font-normal mt-0.5">
                            {stu.rollNumber} • {stu.department}
                          </div>
                        </div>
                        {candidate?.hasEvaluation ? (
                          <EligibilityBadge status={candidate.matchResult.eligibilityStatus} />
                        ) : (
                          <GlassBadge variant="muted" size="sm">Not evaluated</GlassBadge>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-border-subtle">
              {/* Match Score Row */}
              <tr className="bg-canvas-subtle/40">
                <td className="py-4 px-4 font-bold text-text">AI Match Score</td>
                {compareStudents.map((stu) => {
                  const candidate = candidates.find((c) => c.student.id === stu.id);
                  return (
                    <td key={stu.id} className="py-4 px-4">
                      {candidate?.hasEvaluation ? (
                        <MatchScore
                          score={candidate.matchResult.overallScore}
                          confidence={candidate.matchResult.confidenceScore}
                          size="sm"
                        />
                      ) : (
                        <span className="text-caption text-text-faint">Not evaluated yet</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* CGPA */}
              <tr>
                <td className="py-3.5 px-4 font-medium text-text-muted">Academic CGPA</td>
                {compareStudents.map((stu) => (
                  <td key={stu.id} className="py-3.5 px-4 font-bold text-text tabular">
                    {formatCgpa(stu.cgpa)}
                  </td>
                ))}
              </tr>

              {/* Active Backlogs */}
              <tr>
                <td className="py-3.5 px-4 font-medium text-text-muted">Active Backlogs</td>
                {compareStudents.map((stu) => (
                  <td key={stu.id} className="py-3.5 px-4 font-semibold tabular">
                    {stu.activeBacklogs === 0 ? (
                      <span className="text-success">0 (Clear)</span>
                    ) : (
                      <span className="text-danger">{stu.activeBacklogs} Active</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Placement Readiness */}
              <tr>
                <td className="py-3.5 px-4 font-medium text-text-muted">Campus Readiness Index</td>
                {compareStudents.map((stu) => (
                  <td key={stu.id} className="py-3.5 px-4 font-bold tabular text-text">
                    {stu.placementReadiness}%
                  </td>
                ))}
              </tr>

              {/* Skill Matrix Header */}
              <tr className="bg-canvas-subtle font-semibold text-caption uppercase tracking-wider text-text-faint">
                <td colSpan={4} className="py-2.5 px-4">
                  Technical Skill Requirements Matrix
                </td>
              </tr>

              {/* Skills rows */}
              {comparisonSkills.map((skillName) => (
                <tr key={skillName} className="hover:bg-surface-raised/50 transition-base">
                  <td className="py-3 px-4 font-medium text-text">{skillName}</td>
                  {compareStudents.map((stu) => {
                    const candidate = candidates.find((c) => c.student.id === stu.id);
                    // Without an evaluation there is no evidence either way —
                    // a red "missing" chip would misstate skills the student has
                    if (!candidate?.hasEvaluation) {
                      return (
                        <td key={stu.id} className="py-3 px-4 text-text-faint">
                          —
                        </td>
                      );
                    }
                    const match = candidate.matchResult;
                    const isStrong = match.strongSkills.some((s) => s.name.toLowerCase() === skillName.toLowerCase());
                    const isPartial = match.partialSkills.some((s) => s.name.toLowerCase() === skillName.toLowerCase());
                    const status = isStrong ? 'strong' : isPartial ? 'partial' : 'missing';

                    return (
                      <td key={stu.id} className="py-3 px-4">
                        <SkillChip skill={skillName} status={status} size="sm" />
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Actions row */}
              <tr className="bg-surface-raised">
                <td className="py-4 px-4 font-semibold text-text">Review & Shortlist</td>
                {compareStudents.map((stu) => (
                  <td key={stu.id} className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <GlassButton href={`/placement/candidates/${stu.id}?jobId=${selectedJobId}`} variant="ghost" size="sm">
                        Inspect
                      </GlassButton>
                      <GlassButton variant="primary" size="sm">
                        Shortlist
                      </GlassButton>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
