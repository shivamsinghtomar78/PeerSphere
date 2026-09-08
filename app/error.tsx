'use client';

import React, { useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { GlassButton } from '@/components/ui/GlassButton';

/**
 * Route-level error boundary: shown when a page render throws.
 * Never exposes internals — the digest is logged for correlation.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ROUTE_ERROR]', error.digest ?? '', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas">
      <GlassCard variant="surface" padding="lg" className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-danger-light flex items-center justify-center text-danger-dark text-2xl" aria-hidden>
          !
        </div>
        <h1 className="text-xl font-bold text-text">Something went wrong</h1>
        <p className="text-sm text-text-muted">
          The page hit an unexpected error. Try again, or head back home.
          {error.digest && (
            <span className="block mt-1 text-xs text-text-faint">Reference: {error.digest}</span>
          )}
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <GlassButton variant="secondary" href="/">
            Go home
          </GlassButton>
          <ClayButton onClick={reset}>Try again</ClayButton>
        </div>
      </GlassCard>
    </div>
  );
}
