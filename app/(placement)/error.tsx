'use client';

import React, { useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { GlassButton } from '@/components/ui/GlassButton';

/**
 * Placement-portal error boundary: one broken dashboard widget fails inside
 * the console shell (sidebar and navigation stay usable) instead of taking
 * down the whole app the way the root boundary would.
 */
export default function PlacementPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PLACEMENT_PORTAL_ERROR]', error.digest ?? '', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-6 min-h-[60vh]">
      <GlassCard variant="surface" padding="lg" className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-danger-light flex items-center justify-center text-danger-dark text-2xl" aria-hidden>
          !
        </div>
        <h1 className="text-xl font-bold text-text">This page hit an error</h1>
        <p className="text-sm text-text-muted">
          The rest of the console is unaffected — try again, or open the operations dashboard.
          {error.digest && (
            <span className="block mt-1 text-xs text-text-faint">Reference: {error.digest}</span>
          )}
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <GlassButton variant="secondary" href="/placement">
            Go to dashboard
          </GlassButton>
          <ClayButton onClick={reset}>Try again</ClayButton>
        </div>
      </GlassCard>
    </div>
  );
}
