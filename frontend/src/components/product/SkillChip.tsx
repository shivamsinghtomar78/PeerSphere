'use client';

import React from 'react';
import { cn, skillStatusSymbol } from '@/lib/utils';
import type { Skill, SkillStatus } from '@/types';

interface SkillChipProps {
  skill: Skill | string;
  status?: SkillStatus;
  size?: 'sm' | 'md';
  showStatusSymbol?: boolean;
  className?: string;
}

export function SkillChip({
  skill,
  status,
  size = 'sm',
  showStatusSymbol = true,
  className,
}: SkillChipProps) {
  const name = typeof skill === 'string' ? skill : skill.name;
  const activeStatus = status || (typeof skill !== 'string' ? skill.status : undefined);

  const statusStyles: Record<SkillStatus, string> = {
    strong: 'bg-success-light text-success border-[var(--ps-success)]',
    partial: 'bg-warning-light text-warning border-[var(--ps-warning)]',
    missing: 'bg-danger-light text-danger border-[var(--ps-danger)]',
  };

  const defaultStyle = 'bg-surface-raised text-text border-border hover:border-border-strong';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium border rounded-pill transition-base select-none',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        activeStatus ? statusStyles[activeStatus] : defaultStyle,
        className
      )}
    >
      {activeStatus && showStatusSymbol && (
        <span className="font-bold shrink-0" aria-hidden="true">
          {skillStatusSymbol(activeStatus)}
        </span>
      )}
      <span>{name}</span>
      {activeStatus && (
        <span className="sr-only">({activeStatus} match)</span>
      )}
    </span>
  );
}

export function SkillStatusLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
      <span className="flex items-center gap-1">
        <span className="text-success font-bold">✓</span> Strong Match
      </span>
      <span className="flex items-center gap-1">
        <span className="text-warning font-bold">⚠</span> Partial Match
      </span>
      <span className="flex items-center gap-1">
        <span className="text-danger font-bold">✕</span> Missing
      </span>
    </div>
  );
}
