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
} from '@/services/placement-api';
import type { BackendJob } from '@/types/api';
import type { Candidate } from '@/types';
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

        // Honour a ?jobId= deep link; fall back to the first published job.
        // Candidates load in the [selectedJobId] effect — fetching them here
        // too issued every request twice and, on a cold database, pushed the
        // stacked calls past the client timeout.
        if (backendJobs.length > 0) {
          const requestedJobId = new URLSearchParams(window.location.search).get('jobId');
          const initialJobId = backendJobs.some((j) => j.jobId === requestedJobId)
            ? (requestedJobId as string)
            : backendJobs[0].jobId;
          setSelectedJobId(initialJobId);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load candidates');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch candidates when selected job changes (including the initial selection).
  // The stale flag stops an out-of-order response from a quickly-abandoned
  // drive selection overwriting the ranking of the drive now on screen.
  useEffect(() => {
    if (!selectedJobId) return;
    let stale = false;

    const fetchCandidates = async () => {
      try {
        const candidatesData = await fetchCandidatesForJob(selectedJobId);
        if (stale) return;
        setCandidates(candidatesData);
        setIsLoading(false);
      } catch (err) {
        if (stale) return;
        const message = err instanceof Error ? err.message : 'Failed to load candidates for this job';
        setIsLoading(false);
        toast(message, 'error');
      }
    };

    fetchCandidates();
    return () => {
      stale = true;
    };
  }, [selectedJobId, toast]);

  const handleShortlistToggle = async (studentId: string) => {
    const candidate = candidates.find((c) => c.student.id === studentId);
    if (!candidate) return;

    const nowShortlisted = !candidate.isShortlisted;
    try {
      await updateApplicationStatus(candidate.application.id, nowShortlisted ? 'SHORTLISTED' : 'APPLIED');
      setCandidates((prev) =>
        prev.map((c) =>
          c.student.id === studentId
            ? { ...c, isShortlisted: nowShortlisted, shortlistedAt: nowShortlisted ? new Date().toISOString() : undefined }
            : c
        )
      );
      toast(nowShortlisted ? 'Candidate added to shortlist' : 'Removed from shortlist', nowShortlisted ? 'success' : 'info');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update shortlist';
      toast(message, 'error');
    }
  };

  const handleExportCsv = () => {
    if (candidates.length === 0) {
      toast('No candidates to export', 'info');
      return;
    }

    const header = ['Rank', 'Name', 'Roll Number', 'Department', 'CGPA', 'Match Score (%)', 'Confidence (%)', 'Eligibility', 'Strong Skills', 'Missing Skills', 'Shortlisted'];
    const rows = filtered.map((c) => [
      c.rank ?? '',
      c.student.name,
      c.student.rollNumber,
      c.student.department,
      formatCgpa(c.student.cgpa),
      c.matchResult.overallScore,
      c.matchResult.confidenceScore,
      c.matchResult.eligibilityStatus,
      c.matchResult.strongSkills.map((s) => s.name).join('; '),
      c.matchResult.missingSkills.map((s) => s.name).join('; '),
      c.isShortlisted ? 'Yes' : 'No',
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const job = frontendJobs.find((j) => j.id === selectedJobId);
    link.href = url;
    link.download = `candidates-${job ? job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'export'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast(`Exported ${filtered.length} candidates`, 'success');
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
          <GlassButton variant="secondary" size="md" onClick={handleExportCsv}>
            Export CSV
          </GlassButton>
          <GlassButton
            href={selectedJobId ? `/placement/compare?jobId=${selectedJobId}` : '/placement/compare'}
            variant="primary"
            size="md"
          >
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
              onChange={(e) => setSortBy(e.target.value as 'rank' | 'score' | 'cgpa')}
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
                      {cand.rank ? `#${cand.rank}` : '—'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-text hover:text-accent">
                      <Link href={`/placement/candidates/${cand.student.id}?jobId=${selectedJobId}`}>{cand.student.name}</Link>
                    </div>
                    <div className="text-caption text-text-muted mt-0.5">
                      {cand.student.rollNumber} • CGPA: <strong className="text-text tabular">{formatCgpa(cand.student.cgpa)}</strong>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {cand.hasEvaluation ? (
                      <MatchScore
                        score={cand.matchResult.overallScore}
                        size="sm"
                        showDetails={false}
                      />
                    ) : (
                      <GlassBadge variant="muted" size="sm">Not evaluated</GlassBadge>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {cand.hasEvaluation ? (
                      <ConfidenceBadge confidence={cand.matchResult.confidenceScore} />
                    ) : (
                      <span className="text-caption text-text-faint">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {cand.hasEvaluation ? (
                      <EligibilityBadge status={cand.matchResult.eligibilityStatus} />
                    ) : (
                      <span className="text-caption text-text-faint">Awaiting evaluation</span>
                    )}
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
                      {!cand.hasEvaluation && (
                        <span className="text-caption text-text-faint">—</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {!cand.hasEvaluation ? (
                        <span className="text-caption text-text-faint">—</span>
                      ) : cand.matchResult.missingSkills.length > 0 ? (
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
                      <GlassButton href={`/placement/candidates/${cand.student.id}?jobId=${selectedJobId}`} variant="ghost" size="sm">
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
