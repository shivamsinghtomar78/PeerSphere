'use client';

import React, { useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { GlassButton } from '@/components/ui/GlassButton';

/**
 * Student-portal error boundary: a broken widget on one page fails inside the
 * portal shell (sidebar and navigation stay usable) instead of unmounting the
 * whole app the way the root boundary would.
 */
export default function StudentPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[STUDENT_PORTAL_ERROR]', error.digest ?? '', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-6 min-h-[60vh]">
      <GlassCard variant="surface" padding="lg" className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-danger-light flex items-center justify-center text-danger-dark text-2xl" aria-hidden>
          !
        </div>
        <h1 className="text-xl font-bold text-text">This page hit an error</h1>
        <p className="text-sm text-text-muted">
          The rest of your workspace is unaffected — try again, or open your dashboard.
          {error.digest && (
            <span className="block mt-1 text-xs text-text-faint">Reference: {error.digest}</span>
          )}
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <GlassButton variant="secondary" href="/student">
            Go to dashboard
          </GlassButton>
          <ClayButton onClick={reset}>Try again</ClayButton>
        </div>
      </GlassCard>
    </div>
  );
}
