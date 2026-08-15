'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore } from '@/components/product/MatchScore';
import { SkillChip } from '@/components/product/SkillChip';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchAllJobs,
  fetchAllStudents,
  fetchCandidatesForJob,
  convertToFrontendJob,
  convertToFrontendStudent,
  getTopCandidates,
} from '@/services/placement-api';
import type { BackendJob, BackendStudent } from '@/types/api';
import type { Job, Student, Candidate } from '@/types';
import { formatCgpa, skillStatusSymbol } from '@/lib/utils';

export default function CandidateComparisonPage() {
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, studentsData] = await Promise.all([
          fetchAllJobs({ pageSize: 20, status: 'PUBLISHED' }),
          fetchAllStudents({ pageSize: 50 }),
        ]);

        const backendJobs = jobsData?.items || [];
        const frontendStudents = studentsData?.items.map(convertToFrontendStudent) || [];

        setJobs(backendJobs);
        setStudents(frontendStudents);

        // Select first job and fetch top candidates
        if (backendJobs.length > 0) {
          setSelectedJobId(backendJobs[0].jobId);
          const candidatesData = await fetchCandidatesForJob(backendJobs[0].jobId);
          const topCandidates = getTopCandidates(candidatesData, 3);
          setCandidates(topCandidates);
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comparison data');
        setIsLoading(false);
      }
    };

    fetchData();
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
  const targetJob = frontendJobs[0] || null;
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
  const comparisonSkills = targetJob?.requiredSkills.map(s => s.name) || [
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

        <Link href="/placement/candidates">
          <GlassButton variant="secondary" size="md">
            ← Back to All Candidates
          </GlassButton>
        </Link>
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
                  const match = candidate?.matchResult;
                  return (
                    <th key={stu.id} className="py-4 px-4 font-bold text-text w-1/4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-base text-text">{stu.name}</div>
                          <div className="text-caption text-text-muted font-normal mt-0.5">
                            {stu.rollNumber} • {stu.department}
                          </div>
                        </div>
                        <EligibilityBadge status={match.eligibilityStatus} />
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
                  const match = candidate?.matchResult;
                  return (
                    <td key={stu.id} className="py-4 px-4">
                      <MatchScore score={match.overallScore} confidence={match.confidenceScore} size="sm" />
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
                  const match = candidate?.matchResult;
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
                      <Link href={`/placement/candidates/${stu.id}`}>
                        <GlassButton variant="ghost" size="sm">
                          Inspect
                        </GlassButton>
                      </Link>
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
