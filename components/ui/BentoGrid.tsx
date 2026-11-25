'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type BentoSpan = 'compact' | 'medium' | 'wide' | 'tall' | 'hero' | 'full';

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

const colMap = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const gapMap = {
  sm: 'gap-3',
  md: 'gap-4 sm:gap-5',
  lg: 'gap-5 sm:gap-6',
};

/**
 * BentoGrid — responsive asymmetrical CSS Grid container.
 * Adapts from multi-column desktop layouts down to tablet (2-col) and mobile (1-col).
 */
export function BentoGrid({
  columns = 3,
  gap = 'md',
  className,
  children,
  ...props
}: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid auto-rows-[minmax(140px,auto)]',
        colMap[columns],
        gapMap[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: BentoSpan;
  tone?: 'surface' | 'raised' | 'accent' | 'ink' | 'canvas';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const spanMap: Record<BentoSpan, string> = {
  compact: 'col-span-1',
  medium: 'col-span-1',
  wide: 'col-span-1 md:col-span-2',
  tall: 'col-span-1 lg:row-span-2',
  hero: 'col-span-1 md:col-span-2 lg:row-span-2',
  full: 'col-span-1 md:col-span-2 lg:col-span-full',
};

const toneMap = {
  surface: 'bg-surface border border-border-subtle shadow-[0_1px_2px_rgb(18_32_56/0.04),0_10px_28px_rgb(18_32_56/0.04)]',
  raised: 'bg-surface-raised border border-border shadow-[0_12px_34px_rgb(18_32_56/0.07)]',
  accent: 'bg-gradient-to-br from-[var(--ps-accent-light)] via-[var(--ps-surface)] to-[var(--ps-surface)] border border-[color-mix(in_srgb,var(--ps-accent)_22%,var(--ps-border))]',
  ink: 'bg-[#122038] text-white border border-white/10 shadow-[0_16px_40px_rgb(18_32_56/0.22)]',
  canvas: 'bg-canvas-subtle border border-border-subtle',
};

const paddingMap = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-5 sm:p-6',
};

/**
 * BentoCard — structured Bento cell with intentional hierarchy, lighting, and hover elevation.
 */
export function BentoCard({
  span = 'medium',
  tone = 'surface',
  interactive = false,
  padding = 'lg',
  className,
  children,
  ...props
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 motion-reduce:transition-none',
        spanMap[span],
        toneMap[tone],
        paddingMap[padding],
        interactive && 'hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--ps-accent)_40%,var(--ps-border))] hover:shadow-[0_16px_38px_rgb(18_32_56/0.09)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
