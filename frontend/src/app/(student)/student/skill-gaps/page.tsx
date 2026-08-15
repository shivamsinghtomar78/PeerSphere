'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassTabs } from '@/components/ui/GlassTabs';
import { SkillGapCard } from '@/components/product/SkillGapCard';
import { mockSkillGaps } from '@/data/index';

export default function SkillGapsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Gaps', badge: mockSkillGaps.length },
    { id: 'high', label: 'High Priority', badge: mockSkillGaps.filter((g) => g.priority === 'high').length },
    { id: 'medium', label: 'Medium Priority', badge: mockSkillGaps.filter((g) => g.priority === 'medium').length },
    { id: 'low', label: 'Low Priority', badge: mockSkillGaps.filter((g) => g.priority === 'low').length },
  ];

  const filteredGaps = mockSkillGaps.filter((gap) => {
    if (activeTab === 'all') return true;
    return gap.priority === activeTab;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Skill Gap Diagnosis
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Prioritized missing skills based on high-frequency requirements in top hiring roles.
          </p>
        </div>

        <Link href="/student/recommendations">
          <GlassButton variant="primary" size="md">
            View Learning Roadmap →
          </GlassButton>
        </Link>
      </div>

      {/* Impact Summary Card */}
      <GlassCard variant="surface-raised" padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-accent-light/40 border-accent/20">
        <div>
          <h2 className="text-title text-text font-bold">Close 2 Key Skills to Gain +22% Match Score</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Focusing on Spring Boot and REST API gives you the highest placement probability for Tier-1 Backend roles.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-2xl font-bold text-accent tabular">+22%</span>
          <span className="text-xs text-text-muted max-w-[80px]">Estimated score uplift</span>
        </div>
      </GlassCard>

      {/* Filter Tabs */}
      <div className="flex justify-start">
        <GlassTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="glass"
        />
      </div>

      {/* Skill Gaps List */}
      <div className="space-y-4">
        {filteredGaps.map((gap, i) => (
          <SkillGapCard key={i} gap={gap} defaultExpanded={gap.priority === 'high'} />
        ))}
      </div>
    </div>
  );
}
