'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassTabs } from '@/components/ui/GlassTabs';
import { SkillGapCard } from '@/components/product/SkillGapCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchMyEvaluations,
  extractSkillGapsFromEvaluations,
} from '@/services/student-api';
import type { SkillGap } from '@/types';

export default function SkillGapsPage() {
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const evaluationsData = await fetchMyEvaluations();
        const evaluations = evaluationsData?.items || [];
        
        // Extract skill gaps from evaluations
        const gaps = extractSkillGapsFromEvaluations(evaluations);
        setSkillGaps(gaps);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skill gaps');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { id: 'all', label: 'All Gaps', badge: skillGaps.length },
    { id: 'high', label: 'High Priority', badge: skillGaps.filter((g) => g.priority === 'high').length },
    { id: 'medium', label: 'Medium Priority', badge: skillGaps.filter((g) => g.priority === 'medium').length },
    { id: 'low', label: 'Low Priority', badge: skillGaps.filter((g) => g.priority === 'low').length },
  ];

  const filteredGaps = skillGaps.filter((gap) => {
    if (activeTab === 'all') return true;
    return gap.priority === activeTab;
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <LoadingState label="Loading skill gaps..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <ErrorState title="Failed to load skill gaps" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Calculate potential match improvement from high priority gaps
  const highPriorityGaps = skillGaps.filter(g => g.priority === 'high');
  const totalPotentialImprovement = highPriorityGaps.reduce(
    (sum, gap) => sum + (gap.potentialMatchImprovement || 0),
    0
  );

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

      {skillGaps.length > 0 ? (
        <>
          {/* Impact Summary Card */}
          <GlassCard variant="surface-raised" padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-accent-light/40 border-accent/20">
            <div>
              <h2 className="text-title text-text font-bold">
                Close {highPriorityGaps.length} Key Skill{highPriorityGaps.length !== 1 ? 's' : ''} to Gain +{totalPotentialImprovement}% Match Score
              </h2>
              <p className="text-sm text-text-muted mt-0.5">
                {highPriorityGaps.length > 0 
                  ? `Focusing on ${highPriorityGaps.slice(0, 2).map(g => g.skill.name).join(' and ')} gives you the highest placement probability.`
                  : 'Your skill gaps are prioritized based on placement impact.'}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-2xl font-bold text-accent tabular">+{totalPotentialImprovement}%</span>
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
            {filteredGaps.length > 0 ? (
              filteredGaps.map((gap, i) => (
                <SkillGapCard key={gap.skill.id || i} gap={gap} defaultExpanded={gap.priority === 'high'} />
              ))
            ) : (
              <EmptyState
                title="No gaps in this category"
                description={`No ${activeTab} priority skill gaps found.`}
              />
            )}
          </div>
        </>
      ) : (
        <EmptyState
          title="No skill gaps identified"
          description="Your profile looks strong! Continue building skills to stay competitive."
        />
      )}
    </div>
  );
}
