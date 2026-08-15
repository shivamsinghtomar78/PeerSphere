'use client';

import React from 'react';
import Link from 'next/link';
import { cn, formatCgpa } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore } from '@/components/product/MatchScore';
import { SkillChip } from '@/components/product/SkillChip';
import type { Candidate } from '@/types';

interface CandidateCardProps {
  candidate: Candidate;
  onShortlistToggle?: (studentId: string) => void;
  className?: string;
}

export function CandidateCard({
  candidate,
  onShortlistToggle,
  className,
}: CandidateCardProps) {
  const { student, matchResult, rank, isShortlisted } = candidate;

  return (
    <GlassCard variant="surface" padding="md" className={cn('flex flex-col justify-between transition-base', className)}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {rank && (
              <span className="w-7 h-7 rounded-md bg-canvas-subtle border border-border-subtle flex items-center justify-center font-bold text-xs tabular text-text-muted shrink-0">
                #{rank}
              </span>
            )}
            <div>
              <h4 className="text-title text-text font-semibold hover:text-accent transition-base">
                <Link href={`/placement/candidates/${student.id}`}>{student.name}</Link>
              </h4>
              <div className="flex items-center gap-2 text-caption text-text-muted flex-wrap mt-0.5">
                <span>{student.rollNumber}</span>
                <span>•</span>
                <span>{student.department}</span>
                <span>•</span>
                <span className="font-semibold text-text tabular">CGPA: {formatCgpa(student.cgpa)}</span>
              </div>
            </div>
          </div>

          <MatchScore
            score={matchResult.overallScore}
            confidence={matchResult.confidenceScore}
            size="sm"
            showDetails={false}
          />
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <EligibilityBadge status={matchResult.eligibilityStatus} />
          {isShortlisted && (
            <GlassBadge variant="accent" size="sm" dot>
              Shortlisted
            </GlassBadge>
          )}
          {matchResult.requiresHumanReview && (
            <GlassBadge variant="warning" size="sm" dot>
              Review Flagged
            </GlassBadge>
          )}
        </div>

        {/* Strong vs Missing Skills Preview */}
        <div className="mt-4 space-y-2">
          {matchResult.strongSkills.length > 0 && (
            <div>
              <div className="text-caption text-text-faint font-medium mb-1">Strong Match</div>
              <div className="flex flex-wrap gap-1">
                {matchResult.strongSkills.slice(0, 3).map((sk) => (
                  <SkillChip key={sk.id} skill={sk} status="strong" size="sm" />
                ))}
                {matchResult.strongSkills.length > 3 && (
                  <span className="text-caption text-text-muted self-center">
                    +{matchResult.strongSkills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {matchResult.missingSkills.length > 0 && (
            <div>
              <div className="text-caption text-text-faint font-medium mb-1">Key Gaps</div>
              <div className="flex flex-wrap gap-1">
                {matchResult.missingSkills.slice(0, 3).map((sk) => (
                  <SkillChip key={sk.id} skill={sk} status="missing" size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
        <Link href={`/placement/candidates/${student.id}`}>
          <GlassButton variant="ghost" size="sm">
            Inspect Profile
          </GlassButton>
        </Link>

        <GlassButton
          variant={isShortlisted ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => onShortlistToggle?.(student.id)}
        >
          {isShortlisted ? 'Remove Shortlist' : 'Shortlist'}
        </GlassButton>
      </div>
    </GlassCard>
  );
}
