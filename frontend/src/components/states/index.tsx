'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ─── Loading State ─────────────────────────────────────────────────
export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex flex-col items-center justify-center gap-3 p-12 text-text-muted', className)}
    >
      <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  lines?: number; // for text variant
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  lines = 1,
  className,
  style,
  ...props
}: SkeletonProps) {
  const base = 'animate-pulse bg-gradient-to-r from-border-subtle via-border to-border-subtle bg-[length:200%_100%]';

  if (variant === 'text') {
    return (
      <div className={cn('flex flex-col gap-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(base, 'h-4 rounded-sm')}
            style={{ width: i === lines - 1 && lines > 1 ? '70%' : '100%', ...style }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    const s = width ?? height ?? '2.5rem';
    return (
      <div
        className={cn(base, 'rounded-full', className)}
        style={{ width: s, height: s, ...style }}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(base, 'rounded-md', className)}
      style={{ width: width ?? '100%', height: height ?? '1rem', ...style }}
      {...props}
    />
  );
}

// ─── Empty State ──────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 p-12 text-center', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-surface-raised flex items-center justify-center text-text-faint">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-title text-text">{title}</p>
        {description && <p className="text-sm text-text-muted max-w-xs">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-4 p-12 text-center', className)}
    >
      <div className="w-12 h-12 rounded-xl bg-danger-light flex items-center justify-center text-danger">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-title text-text">{title}</p>
        <p className="text-sm text-text-muted max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-accent hover:text-accent-dark underline transition-base"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Success State ────────────────────────────────────────────────
interface SuccessStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SuccessState({ title, description, action, className }: SuccessStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 p-12 text-center', className)}>
      <div className="w-12 h-12 rounded-xl bg-success-light flex items-center justify-center text-success">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-title text-text">{title}</p>
        {description && <p className="text-sm text-text-muted max-w-xs">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
