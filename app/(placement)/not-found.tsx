'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

export default function PlacementNotFound() {
  return (
    <AppShell role="placement" title="Page Not Found">
      <div className="flex flex-1 items-center justify-center min-h-full p-6">
        <GlassCard
          variant="surface"
          padding="lg"
          radius="xl"
          className="w-full max-w-md text-center"
        >
          {/* Large 404 display */}
          <p
            className="text-[8rem] font-bold leading-none text-accent select-none"
            aria-hidden="true"
          >
            404
          </p>

          {/* Accessible heading */}
          <h1 className="mt-2 text-2xl font-semibold text-text">
            404 — Page Not Found
          </h1>

          <p className="mt-3 text-text-muted text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Head back to your console to continue.
          </p>

          <div className="mt-8">
            <GlassButton href="/placement" variant="primary" size="lg" fullWidth tabIndex={-1}>
              Back to Placement Console
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
