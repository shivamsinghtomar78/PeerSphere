'use client';

import React from 'react';
import { cn, formatScore, scoreBadgeVariant, confidenceLabel } from '@/lib/utils';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import type { EligibilityStatus } from '@/types';

interface MatchScoreProps {
  score: number;
  confidence?: number;
  eligibility?: EligibilityStatus;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export function MatchScore({
  score,
  confidence,
  eligibility,
  size = 'md',
  showDetails = true,
  className,
}: MatchScoreProps) {
  const badgeVariant = scoreBadgeVariant(score);

  // SVG dimensions based on size
  const dim = size === 'sm' ? 44 : size === 'lg' ? 88 : 64;
  const stroke = size === 'sm' ? 4 : size === 'lg' ? 7 : 5.5;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 80 ? 'var(--ps-match-strong)' : score >= 60 ? 'var(--ps-match-partial)' : 'var(--ps-match-missing)';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex items-center justify-center shrink-0" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="transform -rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className="text-border-subtle"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <span
          className={cn(
            'absolute font-bold tabular tracking-tight text-text',
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm'
          )}
        >
          {formatScore(score)}
        </span>
      </div>

      {showDetails && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <GlassBadge variant={badgeVariant} size="sm">
              {score >= 80 ? 'High Match' : score >= 60 ? 'Moderate Match' : 'Low Match'}
            </GlassBadge>
            {eligibility && <EligibilityBadge status={eligibility} />}
          </div>
          {confidence !== undefined && (
            <span className="text-caption text-text-muted">
              Confidence: <strong className="text-text font-medium">{confidenceLabel(confidence)} ({confidence}%)</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const label = confidenceLabel(confidence);
  const variant = confidence >= 80 ? 'success' : confidence >= 60 ? 'info' : 'warning';

  return (
    <GlassBadge variant={variant} size="sm" dot>
      Confidence: {label} ({confidence}%)
    </GlassBadge>
  );
}
