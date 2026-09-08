'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'muted';

interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean; // show a status dot
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-surface-raised text-text border-border',
  success:  'bg-success-light text-success border-[var(--ps-success)]',
  warning:  'bg-warning-light text-warning border-[var(--ps-warning)]',
  danger:   'bg-danger-light text-danger border-[var(--ps-danger)]',
  info:     'bg-info-light text-info border-[var(--ps-info)]',
  accent:   'bg-accent-light text-accent border-[var(--ps-accent)]',
  muted:    'bg-canvas text-text-muted border-border-subtle',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-text-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  info:    'bg-info',
  accent:  'bg-accent',
  muted:   'bg-text-faint',
};

/**
 * GlassBadge — compact status label.
 * Always render with meaningful text — never rely on color alone.
 */
export function GlassBadge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
  ...props
}: GlassBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'border rounded-pill font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClasses[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// ─── Eligibility Badge (paired icon + label) ───────────────────────
interface EligibilityBadgeProps {
  /** Accepts either casing — API enums are UPPERCASE, frontend types lowercase */
  status: 'eligible' | 'ineligible' | 'conditional' | 'pending' | string;
}

const eligibilityConfig = {
  eligible:    { label: 'Eligible',    variant: 'success' as const, symbol: '✓' },
  ineligible:  { label: 'Not Eligible', variant: 'danger' as const,  symbol: '✕' },
  conditional: { label: 'Conditional', variant: 'warning' as const, symbol: '⚠' },
  pending:     { label: 'Pending',     variant: 'muted' as const,   symbol: '·' },
};

export function EligibilityBadge({ status }: EligibilityBadgeProps) {
  // Normalize casing and never crash the page over an unknown value
  const key = String(status ?? '').toLowerCase() as keyof typeof eligibilityConfig;
  const cfg = eligibilityConfig[key] ?? eligibilityConfig.pending;
  return (
    <GlassBadge variant={cfg.variant}>
      <span aria-hidden="true">{cfg.symbol}</span>
      {cfg.label}
    </GlassBadge>
  );
}
