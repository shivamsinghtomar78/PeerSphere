'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore, ConfidenceBadge } from '@/components/product/MatchScore';
import { SkillChip, SkillStatusLegend } from '@/components/product/SkillChip';
import { ResumeComparison } from '@/components/product/ResumeComparison';
import { HumanReviewBanner } from '@/components/product/HumanReviewBanner';
import { mockJobs } from '@/data/jobs';
import { currentStudent } from '@/data/students';
import { mockMatchResults } from '@/data/index';

export default function MatchAnalysisPage() {
  const [selectedJobId, setSelectedJobId] = useState(mockJobs[0].id);

  const selectedJob = mockJobs.find((j) => j.id === selectedJobId) || mockJobs[0];
  const matchResult =
    mockMatchResults.find((m) => m.jobId === selectedJob.id) || mockMatchResults[0];

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
            {mockJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} — {job.company}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Human review caveat banner if flagged */}
      {matchResult.requiresHumanReview && (
        <HumanReviewBanner note={matchResult.humanReviewNote} />
      )}

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
              {matchResult.matchSummary}
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
              {matchResult.strongSkills.map((sk) => (
                <SkillChip key={sk.id} skill={sk} status="strong" size="sm" />
              ))}
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
              {matchResult.missingSkills.map((sk) => (
                <SkillChip key={sk.id} skill={sk} status="missing" size="sm" />
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Complete Matrix Comparison */}
      <ResumeComparison
        job={selectedJob}
        student={currentStudent}
        matchResult={matchResult}
      />
    </div>
  );
}
