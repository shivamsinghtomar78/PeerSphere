'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ClayVariant = 'accent' | 'neutral';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ClayVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;
}

// Clay is the tactile surface for PRIMARY actions: one accent ClayButton per
// screen; neutral for tactile secondary actions (toggles, segmented choices).
// Overlay chrome stays glass (GlassButton variant="glass"); low-emphasis
// actions stay GlassButton secondary/ghost.
const variantClasses: Record<ClayVariant, string> = {
  accent: 'clay clay-accent clay-interactive',
  neutral: 'clay clay-interactive',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2',
};

/**
 * ClayButton — soft, inflated, tactile button for primary actions.
 * Prop-compatible with GlassButton so call sites can swap 1:1.
 */
export function ClayButton({
  children,
  variant = 'accent',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  href,
  className,
  ...props
}: ClayButtonProps) {
  const isDisabled = disabled || loading;

  const classes = cn(
    'inline-flex items-center justify-center',
    'font-semibold select-none',
    isDisabled && 'opacity-55 cursor-not-allowed pointer-events-none',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className
  );

  const content = loading ? (
    <>
      <LoadingSpinner size={size} />
      <span>{children}</span>
    </>
  ) : (
    <>
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children && <span>{children}</span>}
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-busy={loading}
        {...(props as unknown as React.HTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button disabled={isDisabled} className={classes} aria-busy={loading} {...props}>
      {content}
    </button>
  );
}

function LoadingSpinner({ size }: { size: ButtonSize }) {
  const s = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <svg className={cn(s, 'animate-spin')} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Clay Chip ─────────────────────────────────────────────────────
// Compact pill for badges / skill tags / priority labels.
interface ClayChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md';
}

export function ClayChip({ children, size = 'md', className, ...props }: ClayChipProps) {
  return (
    <span
      className={cn(
        'clay-chip inline-flex items-center font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs gap-1' : 'px-3 py-1 text-sm gap-1.5',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
