'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';

export default function RootNotFound() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
      {/* Theme toggle pinned to top-right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher compact />
      </div>

      <GlassCard
        variant="surface"
        padding="lg"
        radius="xl"
        className="w-full max-w-lg text-center"
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
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Choose a destination below to get back on track.
        </p>

        {/* Navigation links */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" tabIndex={-1}>
            <GlassButton variant="secondary" size="md">
              Home
            </GlassButton>
          </Link>

          <Link href="/student" tabIndex={-1}>
            <GlassButton variant="primary" size="md">
              Student Portal
            </GlassButton>
          </Link>

          <Link href="/placement" tabIndex={-1}>
            <GlassButton variant="primary" size="md">
              Placement Console
            </GlassButton>
          </Link>
        </div>
      </GlassCard>

      {/* Subtle brand mark */}
      <p className="mt-6 text-xs text-text-muted">PeerSphere</p>
    </div>
  );
}
