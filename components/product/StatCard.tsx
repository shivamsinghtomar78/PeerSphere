'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string | number;
  deltaType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'surface' | 'surface-raised';
  className?: string;
}

export function StatCard({
  label,
  value,
  delta,
  deltaType = 'neutral',
  subtext,
  icon,
  variant = 'surface',
  className,
}: StatCardProps) {
  return (
    <GlassCard variant={variant} padding="md" className={cn('flex flex-col justify-between', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-label text-text-muted">{label}</span>
        {icon && <div className="text-text-faint p-1.5 rounded-md bg-canvas-subtle">{icon}</div>}
      </div>

      <div className="mt-3">
        <div className="text-3xl font-bold tracking-tight text-text tabular">
          {value}
        </div>

        {(delta !== undefined || subtext) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-caption">
            {delta !== undefined && (
              <span
                className={cn(
                  'font-medium inline-flex items-center',
                  deltaType === 'positive' && 'text-success',
                  deltaType === 'negative' && 'text-danger',
                  deltaType === 'neutral' && 'text-text-muted'
                )}
              >
                {deltaType === 'positive' && '↑ '}
                {deltaType === 'negative' && '↓ '}
                {delta}
              </span>
            )}
            {subtext && <span className="text-text-faint">{subtext}</span>}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
