'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { SkillChip } from '@/components/product/SkillChip';
import type { Recommendation } from '@/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  className?: string;
}

export function RecommendationCard({
  recommendation,
  className,
}: RecommendationCardProps) {
  const { skill, priority, currentMatchScore, projectedMatchScore, estimatedTimeWeeks, steps, resources } =
    recommendation;

  const priorityVariant = priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'info';

  return (
    <GlassCard variant="surface" padding="md" className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <SkillChip skill={skill} status="missing" size="md" />
          <GlassBadge variant={priorityVariant} size="sm">
            {priority.toUpperCase()} PRIORITY
          </GlassBadge>
        </div>

        {/* Projected Lift Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-pill bg-surface-raised border border-border-subtle text-xs">
          <span className="text-text-muted">Potential Match:</span>
          <span className="font-bold text-text tabular">{currentMatchScore}%</span>
          <span className="text-success font-bold">→</span>
          <span className="font-bold text-success tabular">{projectedMatchScore}%</span>
          {estimatedTimeWeeks && (
            <span className="text-text-faint ml-1">({estimatedTimeWeeks} wks)</span>
          )}
        </div>
      </div>

      {/* Step Roadmap */}
      <div>
        <div className="text-caption text-text-faint font-semibold uppercase tracking-wider mb-2">
          Milestone Roadmap
        </div>
        <div className="space-y-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 relative z-10">
              <span className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-accent shrink-0 shadow-xs tabular">
                {idx + 1}
              </span>
              <p className="text-sm text-text pt-0.5 leading-snug">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resources if present */}
      {resources && resources.length > 0 && (
        <div className="pt-3 border-t border-border-subtle">
          <div className="text-caption text-text-faint font-semibold uppercase tracking-wider mb-2">
            Suggested Resources
          </div>
          <div className="flex flex-wrap gap-2">
            {resources.map((res, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-canvas-subtle border border-border-subtle text-xs text-text-muted"
              >
                <span className="capitalize font-semibold text-text-faint">[{res.type}]</span>
                <span className="text-text">{res.title}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
