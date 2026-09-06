'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * GlassInput — accessible form text input.
 * Label is required for accessibility (visible or sr-only).
 */
export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  function GlassInput(
    {
      label,
      error,
      hint,
      leftAdornment,
      rightAdornment,
      fullWidth = false,
      id,
      className,
      disabled,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-label text-text"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'relative flex items-center',
            'rounded-sm border bg-surface',
            'transition-base',
            error
              ? 'border-danger focus-within:ring-2 focus-within:ring-danger/40'
              : 'border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20',
            disabled && 'opacity-50 cursor-not-allowed',
            fullWidth && 'w-full'
          )}
        >
          {leftAdornment && (
            <span className="pl-3 text-text-muted shrink-0" aria-hidden="true">
              {leftAdornment}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-errormessage={errorId}
            aria-describedby={cn(hintId, errorId) || undefined}
            className={cn(
              'flex-1 min-w-0 bg-transparent',
              'h-10 px-3 py-2',
              // text-base on touch prevents iOS auto-zoom on focus (16px minimum)
              'text-base sm:text-sm text-text',
              'placeholder:text-text-faint',
              'outline-none',
              'disabled:cursor-not-allowed',
              leftAdornment && 'pl-1',
              rightAdornment && 'pr-1',
              className
            )}
            {...props}
          />
          {rightAdornment && (
            <span className="pr-3 text-text-muted shrink-0" aria-hidden="true">
              {rightAdornment}
            </span>
          )}
        </div>
        {hint && !error && (
          <p id={hintId} className="text-caption text-text-faint">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-caption text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

// ─── GlassSearch ───────────────────────────────────────────────────
interface GlassSearchProps extends Omit<GlassInputProps, 'leftAdornment' | 'label'> {
  onClear?: () => void;
}

export function GlassSearch({
  placeholder = 'Search…',
  value,
  onClear,
  className,
  ...props
}: GlassSearchProps) {
  return (
    <div className={cn('relative', className)}>
      <GlassInput
        label="Search"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id={(props as any).id ?? 'search-input'}
        placeholder={placeholder}
        value={value}
        leftAdornment={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        }
        rightAdornment={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className="text-text-faint hover:text-text transition-base cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          ) : undefined
        }
        fullWidth
        {...props}
      />
      <span className="sr-only">Search</span>
    </div>
  );
}
