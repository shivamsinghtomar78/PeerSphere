'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { GlassButton } from './GlassButton';

interface GlassDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

/**
 * GlassDialog — accessible modal dialog with focus trap.
 * Glass overlay variant for overlays per the design system.
 */
export function GlassDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: GlassDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = 'dialog-title';
  const descId = description ? 'dialog-desc' : undefined;

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-6"
      style={{ zIndex: 'var(--ps-z-dialog)' }}
    >
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-scrim backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          'relative w-full flex flex-col glass-overlay rounded-xl',
          'max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)]',
          'animate-[fadeSlideUp_250ms_ease-out]',
          sizeMap[size]
        )}
        style={{
          zIndex: 'var(--ps-z-dialog)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-border-subtle shrink-0">
          <div className="min-w-0">
            <h2 id={titleId} className="text-title text-text break-words">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-text-muted mt-1">
                {description}
              </p>
            )}
          </div>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close dialog"
            className="ml-4 shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </GlassButton>
        </div>
        {/* Body — scrolls independently on small viewports */}
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-wrap items-center justify-end gap-3 border-t border-border-subtle pt-4 shrink-0">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes fadeSlideUp {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
