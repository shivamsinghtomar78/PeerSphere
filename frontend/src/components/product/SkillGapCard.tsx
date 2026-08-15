'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { SkillChip } from '@/components/product/SkillChip';
import type { SkillGap } from '@/types';

interface SkillGapCardProps {
  gap: SkillGap;
  defaultExpanded?: boolean;
  className?: string;
}

export function SkillGapCard({
  gap,
  defaultExpanded = false,
  className,
}: SkillGapCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const priorityConfig = {
    high: { label: 'High Priority', variant: 'danger' as const },
    medium: { label: 'Medium Priority', variant: 'warning' as const },
    low: { label: 'Low Priority', variant: 'info' as const },
  };

  const priority = priorityConfig[gap.priority];

  return (
    <GlassCard variant="surface" padding="none" className={cn('overflow-hidden transition-base', className)}>
      <div
        className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-surface-raised transition-base"
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
      >
        <div className="flex items-center gap-3">
          <SkillChip skill={gap.skill} status="missing" size="md" />
          <GlassBadge variant={priority.variant} size="sm">
            {priority.label}
          </GlassBadge>
          {gap.potentialMatchImprovement && (
            <span className="hidden sm:inline-flex text-caption text-success font-medium">
              +{gap.potentialMatchImprovement}% Potential Lift
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-caption text-text-faint hidden md:inline">
            {expanded ? 'Hide Details' : 'View Action Steps'}
          </span>
          <svg
            className={cn('w-4 h-4 text-text-muted transition-transform duration-normal', expanded && 'rotate-180')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border-subtle bg-canvas-subtle/50 space-y-3">
          <div>
            <div className="text-caption text-text-faint font-semibold uppercase tracking-wider">
              Why It Matters
            </div>
            <p className="text-sm text-text-muted mt-0.5">{gap.reason}</p>
          </div>

          <div>
            <div className="text-caption text-text-faint font-semibold uppercase tracking-wider">
              Recommended Action
            </div>
            <p className="text-sm text-text font-medium mt-0.5">{gap.recommendation}</p>
          </div>

          {gap.steps && gap.steps.length > 0 && (
            <div>
              <div className="text-caption text-text-faint font-semibold uppercase tracking-wider mb-1.5">
                Improvement Steps
              </div>
              <ol className="space-y-1.5 list-decimal list-inside text-sm text-text-muted">
                {gap.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="text-text">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
