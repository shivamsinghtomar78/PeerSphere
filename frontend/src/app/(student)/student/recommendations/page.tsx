'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { RecommendationCard } from '@/components/product/RecommendationCard';
import { mockRecommendations } from '@/data/index';

export default function RecommendationsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Personalized Improvement Roadmap
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Actionable step-by-step milestones to close critical gaps and elevate your placement match scores.
          </p>
        </div>

        <Link href="/student/jobs">
          <GlassButton variant="secondary" size="md">
            Explore Matching Jobs
          </GlassButton>
        </Link>
      </div>

      {/* Target Role Track Banner */}
      <GlassCard variant="surface" padding="md" className="flex items-center justify-between flex-wrap gap-4 bg-surface-raised border-border-strong">
        <div>
          <span className="text-caption font-semibold uppercase tracking-wider text-accent">
            Current Optimization Goal
          </span>
          <h2 className="text-lg font-bold text-text mt-0.5">
            Backend Engineering & SDE-1 Readiness Track
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Current Match: <strong className="text-text">72%</strong> • Projected Target: <strong className="text-success">86%+</strong> (Estimated 5 weeks)
          </p>
        </div>

        <Link href="/student/profile">
          <GlassButton variant="primary" size="sm">
            Sync Completed Projects →
          </GlassButton>
        </Link>
      </GlassCard>

      {/* Roadmap Cards */}
      <div className="space-y-6">
        <h2 className="text-title font-bold text-text">Milestone Roadmap</h2>
        {mockRecommendations.map((rec) => (
          <RecommendationCard key={rec.id} recommendation={rec} />
        ))}
      </div>
    </div>
  );
}
