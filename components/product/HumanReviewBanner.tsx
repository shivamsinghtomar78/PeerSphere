'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';

interface HumanReviewBannerProps {
  note?: string;
  className?: string;
}

export function HumanReviewBanner({
  note = 'This evaluation includes low-confidence match indicators or conditional eligibility and requires review by an authorized placement officer before final shortlisting.',
  className,
}: HumanReviewBannerProps) {
  return (
    <GlassCard
      variant="surface-raised"
      padding="sm"
      className={cn('border-l-4 border-l-warning bg-warning-light/30', className)}
    >
      <div className="flex items-start gap-3">
        <div className="text-warning p-1 shrink-0" aria-hidden="true">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text">Human Review Required</span>
            <GlassBadge variant="warning" size="sm">
              Decision Support
            </GlassBadge>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{note}</p>
        </div>
      </div>
    </GlassCard>
  );
}
