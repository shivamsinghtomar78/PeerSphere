'use client';

import React from 'react';
import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore } from '@/components/product/MatchScore';
import { SkillChip } from '@/components/product/SkillChip';
import type { Job, MatchResult } from '@/types';

interface JobCardProps {
  job: Job;
  matchResult?: MatchResult;
  viewMode?: 'student' | 'placement' | 'recruiter';
  onApply?: (jobId: string) => void;
  isApplied?: boolean;
  className?: string;
}

export function JobCard({
  job,
  matchResult,
  viewMode = 'student',
  onApply,
  isApplied = false,
  className,
}: JobCardProps) {
  const detailHref = viewMode === 'placement' ? `/placement/jobs` : `/student/jobs/${job.id}`;

  return (
    <GlassCard
      variant="surface"
      padding="md"
      className={cn('flex flex-col justify-between hover:border-border-strong transition-base', className)}
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-caption font-medium uppercase tracking-wider text-text-muted">
              {job.company}
            </span>
            <h3 className="text-title text-text mt-0.5 hover:text-accent transition-base">
              <Link href={detailHref}>{job.title}</Link>
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-caption text-text-muted">
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

          {matchResult && (
            <div className="shrink-0">
              <MatchScore
                score={matchResult.overallScore}
                confidence={matchResult.confidenceScore}
                eligibility={matchResult.eligibilityStatus}
                size="sm"
                showDetails={false}
              />
            </div>
          )}
        </div>

        {/* Match / Eligibility summary badge row */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {matchResult && (
            <EligibilityBadge status={matchResult.eligibilityStatus} />
          )}
          <GlassBadge variant="default" size="sm">
            Min CGPA: {job.eligibility.minCgpa}
          </GlassBadge>
          <span className="text-caption text-text-faint ml-auto">
            Deadline: {formatDate(job.deadline)}
          </span>
        </div>

        {/* Skills list */}
        <div className="mt-4">
          <div className="text-caption text-text-faint mb-1.5 font-medium">Required Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {job.requiredSkills.map((sk) => {
              // Highlight if present in match result
              const status = matchResult?.strongSkills.some((s) => s.name.toLowerCase() === sk.name.toLowerCase())
                ? 'strong'
                : matchResult?.partialSkills.some((s) => s.name.toLowerCase() === sk.name.toLowerCase())
                ? 'partial'
                : matchResult?.missingSkills.some((s) => s.name.toLowerCase() === sk.name.toLowerCase())
                ? 'missing'
                : undefined;

              return <SkillChip key={sk.id} skill={sk} status={status} size="sm" />;
            })}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
        <Link href={detailHref}>
          <GlassButton variant="ghost" size="sm">
            View Details
          </GlassButton>
        </Link>

        {viewMode === 'student' && (
          <div className="flex items-center gap-2">
            {matchResult && (
              <Link href={`/student/match?jobId=${job.id}`}>
                <GlassButton variant="secondary" size="sm">
                  Match Analysis
                </GlassButton>
              </Link>
            )}
            <GlassButton
              variant={isApplied ? 'secondary' : 'primary'}
              size="sm"
              disabled={isApplied}
              onClick={() => onApply?.(job.id)}
            >
              {isApplied ? 'Applied' : 'Apply'}
            </GlassButton>
          </div>
        )}

        {viewMode === 'placement' && (
          <div className="flex items-center gap-2 text-caption text-text-muted">
            <span>{job.applicationCount ?? 0} Applicants</span>
            <span>•</span>
            <Link href="/placement/candidates">
              <GlassButton variant="secondary" size="sm">
                View Candidates
              </GlassButton>
            </Link>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
