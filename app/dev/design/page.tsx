'use client';

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton, GlassIconButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassDialog } from '@/components/ui/GlassDialog';
import { ClayButton, ClayChip } from '@/components/ui/ClayButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { Search, ArrowRight, Star } from 'lucide-react';

/**
 * /dev/design — design-system preview (development only).
 * Every primitive in one place for the visual QA checklist
 * (docs/frontend/design-system.md#qa). Not linked from any navigation.
 */
export default function DesignPreviewPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-10 bg-canvas text-text">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Design System Preview</h1>
        <ThemeSwitcher />
      </header>

      {/* ── Clay: interactive/tactile ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Clay — interactive (primary actions, chips)</h2>
        <div className="flex flex-wrap items-center gap-4">
          <ClayButton size="sm">Small accent</ClayButton>
          <ClayButton size="md">Medium accent</ClayButton>
          <ClayButton size="lg" rightIcon={<ArrowRight size={18} />}>Large accent</ClayButton>
          <ClayButton variant="neutral">Neutral clay</ClayButton>
          <ClayButton disabled>Disabled</ClayButton>
          <ClayButton loading>Loading</ClayButton>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ClayChip size="sm">skill: java</ClayChip>
          <ClayChip>priority: high</ClayChip>
          <ClayChip><Star size={14} /> starred</ClayChip>
        </div>
      </section>

      {/* ── Glass: overlays/elevated ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Glass — overlays & elevated surfaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard>
            <h3 className="font-semibold mb-1">GlassCard</h3>
            <p className="text-sm text-text-muted">
              Floats over content. Translucent, blurred, thin border.
            </p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-3">
              <GlassBadge variant="accent">accent badge</GlassBadge>
              <GlassBadge variant="success">success</GlassBadge>
              <GlassBadge variant="danger">danger</GlassBadge>
            </div>
          </GlassCard>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <GlassButton variant="glass">Glass control</GlassButton>
          <GlassButton variant="secondary">Secondary</GlassButton>
          <GlassButton variant="ghost">Ghost</GlassButton>
          <GlassIconButton label="Search"><Search size={18} /></GlassIconButton>
          <GlassButton variant="glass" onClick={() => setDialogOpen(true)}>
            Open GlassDialog
          </GlassButton>
        </div>
        <div className="max-w-sm">
          <GlassInput placeholder="GlassInput — type here" aria-label="Preview input" />
        </div>
      </section>

      {/* ── Minimalist layout states ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">States</h2>
        <div className="flex gap-4 items-center">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </section>

      <GlassDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Glass over content"
      >
        <p className="text-sm text-text-muted mb-4">
          Overlay surface: glass. Its primary action: clay.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</GlassButton>
          <ClayButton onClick={() => setDialogOpen(false)}>Confirm</ClayButton>
        </div>
      </GlassDialog>
    </div>
  );
}
