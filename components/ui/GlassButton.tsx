'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent text-text-inverse',
    'hover:bg-accent-dark',
    'active:scale-[0.98]',
    'shadow-sm hover:shadow-md',
    'border border-transparent',
  ].join(' '),
  secondary: [
    'bg-surface-raised text-text',
    'border border-border',
    'hover:border-border-strong hover:bg-surface',
    'active:scale-[0.98]',
    'shadow-sm',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-muted',
    'border border-transparent',
    'hover:bg-surface-raised hover:text-text',
    'active:scale-[0.98]',
  ].join(' '),
  danger: [
    'bg-danger text-text-inverse',
    'hover:bg-danger-dark',
    'active:scale-[0.98]',
    'border border-transparent',
    'shadow-sm',
  ].join(' '),
  glass: [
    'glass-ctrl glass-focus',
    'text-text',
    'hover:text-accent',
    'active:scale-[0.98]',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

/**
 * GlassButton — the primary interactive button.
 * Uses the 'glass' variant for navigation/control chrome.
 * Uses 'primary'/'secondary' for content actions.
 * Supports href prop to render as a Next.js Link.
 */
export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  href,
  className,
  ...props
}: GlassButtonProps) {
  const isDisabled = disabled || loading;

  // If href is provided, render as a Link
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          // Base
          'inline-flex items-center justify-center',
          'font-medium rounded-sm',
          'transition-base',
          'cursor-pointer select-none',
          // Focus
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-[var(--ps-focus)]',
          // Disabled
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          // Width
          fullWidth && 'w-full',
          className
        )}
        aria-busy={loading}
        {...(props as unknown as React.HTMLAttributes<HTMLAnchorElement>)}
      >
        {loading ? (
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
        )}
      </Link>
    );
  }

  // Default: render as a button
  return (
    <button
      disabled={isDisabled}
      className={cn(
        // Base
        'inline-flex items-center justify-center',
        'font-medium rounded-sm',
        'transition-base',
        'cursor-pointer select-none',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-[var(--ps-focus)]',
        // Disabled
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        // Variant
        variantClasses[variant],
        // Size
        sizeClasses[size],
        // Width
        fullWidth && 'w-full',
        className
      )}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
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
      )}
    </button>
  );
}

function LoadingSpinner({ size }: { size: ButtonSize }) {
  const s = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <svg
      className={cn(s, 'animate-spin')}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Icon Button ──────────────────────────────────────────────────
interface GlassIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // accessible name — required
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: string;
}

export function GlassIconButton({
  children,
  label,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  href,
  className,
  ...props
}: GlassIconButtonProps) {
  const isDisabled = disabled || loading;
  const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };

  // If href is provided, render as a Link
  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        aria-busy={loading}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-sm transition-base cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-[var(--ps-focus)]',
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          variantClasses[variant],
          sizeMap[size],
          className
        )}
        {...(props as unknown as React.HTMLAttributes<HTMLAnchorElement>)}
      >
        {loading ? <LoadingSpinner size={size} /> : children}
      </Link>
    );
  }

  // Default: render as a button
  return (
    <button
      disabled={isDisabled}
      aria-label={label}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-sm transition-base cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-[var(--ps-focus)]',
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        variantClasses[variant],
        sizeMap[size],
        className
      )}
      {...props}
    >
      {loading ? <LoadingSpinner size={size} /> : children}
    </button>
  );
}
