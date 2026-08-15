'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore, ConfidenceBadge } from '@/components/product/MatchScore';
import { ResumeComparison } from '@/components/product/ResumeComparison';
import { SkillChip } from '@/components/product/SkillChip';
import { HumanReviewBanner } from '@/components/product/HumanReviewBanner';
import { mockStudents } from '@/data/students';
import { mockJobs } from '@/data/jobs';
import { mockMatchResults, mockSkillGaps } from '@/data/index';
import { formatCgpa } from '@/lib/utils';

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const student = mockStudents.find((s) => s.id === resolvedParams.id);
  const [shortlisted, setShortlisted] = useState(false);

  if (!student) {
    notFound();
  }

  const job = mockJobs[0];
  const matchResult =
    mockMatchResults.find((m) => m.studentId === student.id && m.jobId === job.id) ||
    mockMatchResults[0];

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
      {matchResult.requiresHumanReview && (
        <HumanReviewBanner note={matchResult.humanReviewNote} />
      )}

      {/* Candidate Hero Card */}
      <GlassCard variant="surface" padding="lg" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
                {student.name}
              </h1>
              <EligibilityBadge status={matchResult.eligibilityStatus} />
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
              score={matchResult.overallScore}
              confidence={matchResult.confidenceScore}
              size="lg"
            />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ConfidenceBadge confidence={matchResult.confidenceScore} />
            <span className="text-caption text-text-faint">
              Evaluated against: {job.title} ({job.company})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <GlassButton variant="secondary" size="md">
              Download Candidate PDF
            </GlassButton>
            <GlassButton
              variant={shortlisted ? 'secondary' : 'primary'}
              size="md"
              onClick={() => setShortlisted((s) => !s)}
            >
              {shortlisted ? 'Shortlisted ✓' : 'Add to Official Shortlist'}
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Breakdown Matrix */}
      <div className="space-y-6">
        {/* Skills Section */}
        <GlassCard variant="surface" padding="md" className="space-y-4">
          <h2 className="text-title font-bold text-text">Skill Matching Categorization</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-canvas-subtle border border-border-subtle space-y-2">
              <span className="text-caption font-bold text-success uppercase tracking-wider block">
                Strong Matches ({matchResult.strongSkills.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {matchResult.strongSkills.map((sk) => (
                  <SkillChip key={sk.id} skill={sk} status="strong" size="sm" />
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-canvas-subtle border border-border-subtle space-y-2">
              <span className="text-caption font-bold text-warning uppercase tracking-wider block">
                Partial Matches ({matchResult.partialSkills.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {matchResult.partialSkills.length > 0 ? (
                  matchResult.partialSkills.map((sk) => (
                    <SkillChip key={sk.id} skill={sk} status="partial" size="sm" />
                  ))
                ) : (
                  <span className="text-caption text-text-faint">No partial matches</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-canvas-subtle border border-border-subtle space-y-2">
              <span className="text-caption font-bold text-danger uppercase tracking-wider block">
                Identified Gaps ({matchResult.missingSkills.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {matchResult.missingSkills.length > 0 ? (
                  matchResult.missingSkills.map((sk) => (
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
          matchResult={matchResult}
        />
      </div>
    </div>
  );
}
