'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ─── Base Skeleton ─────────────────────────────────────────────────────────────
// A single shimmer rectangle. Use `animate-pulse` from Tailwind v4.
// The `bg-border-subtle` token gives a neutral fill that works on both light/dark.

type RoundedSize = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

const roundedMap: Record<RoundedSize, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

interface SkeletonProps {
  /** Additional Tailwind classes */
  className?: string;
  /** CSS width value, e.g. '100%', '4rem', 120 */
  width?: string | number;
  /** CSS height value, e.g. '1rem', 20 */
  height?: string | number;
  /** Border-radius size token (default: 'md') */
  rounded?: RoundedSize;
}

export function Skeleton({
  className,
  width,
  height,
  rounded = 'md',
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-border-subtle',
        roundedMap[rounded],
        className
      )}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : '1rem',
      }}
    />
  );
}

// ─── SkeletonText ──────────────────────────────────────────────────────────────
// A stack of text-line skeletons, with the last line narrower to mimic real copy.

type LastLineWidth = 'full' | '2/3' | '1/2';

const lastLineWidthMap: Record<LastLineWidth, string> = {
  full: 'w-full',
  '2/3': 'w-2/3',
  '1/2': 'w-1/2',
};

interface SkeletonTextProps {
  /** Number of text lines (default: 3) */
  lines?: number;
  /** Width of the final line (default: '2/3') */
  lastLineWidth?: LastLineWidth;
  /** Additional Tailwind classes on the wrapper */
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = '2/3',
  className,
}: SkeletonTextProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex flex-col gap-2', className)}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-border-subtle rounded-sm h-4',
            i === lines - 1 && lines > 1
              ? lastLineWidthMap[lastLineWidth]
              : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// ─── SkeletonCard ──────────────────────────────────────────────────────────────
// A card-shaped skeleton mimicking a job/candidate card layout:
//   [ avatar ]  [ title line     ]
//               [ subtitle line  ]
//   [ tag ] [ tag ] [ tag ]
//   [ footer bar ]

export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="bg-surface-raised rounded-lg p-4 space-y-4 border border-border-subtle"
    >
      {/* Header: avatar + two text lines */}
      <div className="flex items-start gap-3">
        {/* Avatar circle */}
        <Skeleton rounded="full" width={40} height={40} className="shrink-0" />
        {/* Title + subtitle */}
        <div className="flex-1 space-y-2">
          <Skeleton height="1rem" width="60%" />
          <Skeleton height="0.75rem" width="40%" />
        </div>
      </div>

      {/* Tag row */}
      <div className="flex gap-2">
        <Skeleton height="1.5rem" width={64} rounded="full" />
        <Skeleton height="1.5rem" width={80} rounded="full" />
        <Skeleton height="1.5rem" width={56} rounded="full" />
      </div>

      {/* Body text */}
      <SkeletonText lines={2} lastLineWidth="1/2" />

      {/* Footer bar */}
      <div className="flex items-center justify-between pt-1">
        <Skeleton height="0.75rem" width={100} />
        <Skeleton height="2rem" width={80} rounded="md" />
      </div>
    </div>
  );
}

// ─── SkeletonTableRow ──────────────────────────────────────────────────────────
// A <tr> with 7 <td> skeleton cells, matching the column layout of the students
// roster table: Student | Roll No | Department | CGPA | Readiness | Skills | Backlogs.
// Reusable in other tables — extra columns beyond 5 degrade gracefully.

export function SkeletonTableRow() {
  return (
    <tr aria-hidden="true">
      {/* Column 1 — name + sub-label */}
      <td className="py-3 px-4">
        <div className="space-y-1.5">
          <Skeleton height="0.875rem" width="70%" />
          <Skeleton height="0.75rem" width="50%" />
        </div>
      </td>

      {/* Column 2 — roll/id */}
      <td className="py-3 px-4">
        <Skeleton height="0.875rem" width={90} />
      </td>

      {/* Column 3 — department / category */}
      <td className="py-3 px-4">
        <Skeleton height="0.875rem" width={120} />
      </td>

      {/* Column 4 — numeric value (CGPA / score) */}
      <td className="py-3 px-4">
        <Skeleton height="0.875rem" width={48} />
      </td>

      {/* Column 5 — percentage / readiness */}
      <td className="py-3 px-4">
        <Skeleton height="0.875rem" width={40} />
      </td>

      {/* Column 6 — skill chips */}
      <td className="py-3 px-4">
        <div className="flex gap-1">
          <Skeleton height="1.5rem" width={56} rounded="full" />
          <Skeleton height="1.5rem" width={48} rounded="full" />
          <Skeleton height="1.5rem" width={44} rounded="full" />
        </div>
      </td>

      {/* Column 7 — badge / status (right-aligned) */}
      <td className="py-3 px-4 text-right">
        <Skeleton height="1.5rem" width={72} rounded="full" className="ml-auto" />
      </td>
    </tr>
  );
}

// ─── SkeletonStatRow ───────────────────────────────────────────────────────────
// A row of 4 stat-card skeletons, matching the typical dashboard stat strip.

function SkeletonStatCard() {
  return (
    <div
      aria-hidden="true"
      className="bg-surface-raised rounded-lg p-4 space-y-3 border border-border-subtle flex-1 min-w-0"
    >
      {/* Label */}
      <Skeleton height="0.75rem" width="50%" />
      {/* Big number */}
      <Skeleton height="2rem" width="40%" rounded="sm" />
      {/* Trend line */}
      <Skeleton height="0.75rem" width="60%" />
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
    </div>
  );
}
