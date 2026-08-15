'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore, ConfidenceBadge } from '@/components/product/MatchScore';
import { SkillChip } from '@/components/product/SkillChip';
import { useToast } from '@/components/ui/Toast';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchAllJobs,
  fetchCandidatesForJob,
  updateApplicationStatus,
  convertToFrontendJob,
  getTopCandidates,
} from '@/services/placement-api';
import { fetchMyEvaluations } from '@/services/student-api';
import type { BackendJob, BackendEvaluation, BackendApplication } from '@/types/api';
import type { Candidate, Job } from '@/types';
import { formatCgpa } from '@/lib/utils';

export default function CandidateRankingPage() {
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'cgpa'>('rank');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobsData = await fetchAllJobs({ pageSize: 20, status: 'PUBLISHED' });
        const backendJobs = jobsData?.items || [];
        setJobs(backendJobs);
        
        // Select first job and fetch candidates for it
        if (backendJobs.length > 0) {
          setSelectedJobId(backendJobs[0].jobId);
          const candidatesData = await fetchCandidatesForJob(backendJobs[0].jobId);
          setCandidates(candidatesData);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load candidates');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch candidates when selected job changes
  useEffect(() => {
    if (!selectedJobId) return;
    
    const fetchCandidates = async () => {
      try {
        const candidatesData = await fetchCandidatesForJob(selectedJobId);
        setCandidates(candidatesData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load candidates for this job';
        toast(message, 'error');
      }
    };

    fetchCandidates();
  }, [selectedJobId, toast]);

  const handleShortlistToggle = (studentId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.student.id !== studentId) return c;
        const nowShortlisted = !c.isShortlisted;
        if (nowShortlisted) {
          toast('Candidate added to shortlist', 'success');
        } else {
          toast('Removed from shortlist', 'info');
        }
        return { ...c, isShortlisted: nowShortlisted };
      })
    );
  };

  const filtered = candidates
    .filter((c) => {
      const matchSearch =
        c.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.student.skills.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.matchResult.overallScore - a.matchResult.overallScore;
      if (sortBy === 'cgpa') return b.student.cgpa - a.student.cgpa;
      return (a.rank ?? 99) - (b.rank ?? 99);
    });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <LoadingState label="Loading candidates..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <ErrorState title="Failed to load candidates" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Create frontend jobs for the selector
  const frontendJobs = jobs.map(convertToFrontendJob);

  if (frontendJobs.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <EmptyState
          title="No jobs available"
          description="There are no published jobs with candidates to display."
        />
      </div>
    );
  }

  // If no job is selected but we have jobs, select the first one
  if (!selectedJobId && frontendJobs.length > 0) {
    setSelectedJobId(frontendJobs[0].id);
    return null; // Re-render with selected job
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Candidate Ranking & Screening Matrix
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Explainable rankings calculated from deterministic eligibility checks and semantic skill coverage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton href="/placement/compare" variant="primary" size="md">
            Compare Top Candidates Matrix →
          </GlassButton>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="w-full md:max-w-xs">
          <GlassInput
            placeholder="Filter candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="drive-select" className="text-caption text-text-muted font-medium whitespace-nowrap">
              Drive:
            </label>
            <select
              id="drive-select"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="h-10 px-3 py-2 rounded-sm border border-border bg-surface text-text text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
            >
              {frontendJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.company})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-caption text-text-muted font-medium whitespace-nowrap">
              Sort By:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 px-3 py-2 rounded-sm border border-border bg-surface text-text text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
            >
              <option value="rank">AI Overall Rank</option>
              <option value="score">Match Score (%)</option>
              <option value="cgpa">Academic CGPA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Ranking Data Table */}
      <GlassCard variant="surface" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" role="table">
            <thead className="bg-canvas-subtle border-b border-border-subtle text-caption uppercase tracking-wider text-text-muted">
              <tr>
                <th className="py-3 px-4 font-semibold">Rank</th>
                <th className="py-3 px-4 font-semibold">Candidate</th>
                <th className="py-3 px-4 font-semibold">Match Score</th>
                <th className="py-3 px-4 font-semibold">Confidence</th>
                <th className="py-3 px-4 font-semibold">Eligibility</th>
                <th className="py-3 px-4 font-semibold">Key Matching Skills</th>
                <th className="py-3 px-4 font-semibold">Gaps</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((cand) => (
                <tr key={cand.student.id} className="hover:bg-surface-raised/50 transition-base">
                  <td className="py-3 px-4">
                    <span className="w-7 h-7 rounded-md bg-canvas-subtle border border-border-subtle flex items-center justify-center font-bold text-xs tabular text-text-muted">
                      #{cand.rank}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-text hover:text-accent">
                      <Link href={`/placement/candidates/${cand.student.id}`}>{cand.student.name}</Link>
                    </div>
                    <div className="text-caption text-text-muted mt-0.5">
                      {cand.student.rollNumber} • CGPA: <strong className="text-text tabular">{formatCgpa(cand.student.cgpa)}</strong>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <MatchScore
                      score={cand.matchResult.overallScore}
                      size="sm"
                      showDetails={false}
                    />
                  </td>

                  <td className="py-3 px-4">
                    <ConfidenceBadge confidence={cand.matchResult.confidenceScore} />
                  </td>

                  <td className="py-3 px-4">
                    <EligibilityBadge status={cand.matchResult.eligibilityStatus} />
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {cand.matchResult.strongSkills.slice(0, 2).map((sk) => (
                        <SkillChip key={sk.id} skill={sk} status="strong" size="sm" />
                      ))}
                      {cand.matchResult.strongSkills.length > 2 && (
                        <span className="text-caption text-text-muted self-center">
                          +{cand.matchResult.strongSkills.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {cand.matchResult.missingSkills.length > 0 ? (
                        cand.matchResult.missingSkills.slice(0, 2).map((sk) => (
                          <SkillChip key={sk.id} skill={sk} status="missing" size="sm" />
                        ))
                      ) : (
                        <span className="text-caption text-success font-medium">None</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <GlassButton href={`/placement/candidates/${cand.student.id}`} variant="ghost" size="sm">
                        Inspect
                      </GlassButton>
                      <GlassButton
                        variant={cand.isShortlisted ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleShortlistToggle(cand.student.id)}
                      >
                        {cand.isShortlisted ? 'Shortlisted ✓' : 'Shortlist'}
                      </GlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
