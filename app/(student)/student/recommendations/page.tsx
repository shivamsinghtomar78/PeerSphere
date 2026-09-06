'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { RecommendationCard } from '@/components/product/RecommendationCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchMyEvaluations,
  fetchMyProfile,
  extractSkillGapsFromEvaluations,
  convertToFrontendStudent,
} from '@/services/student-api';
import type { BackendEvaluation } from '@/types/api';
import type { Student, Recommendation } from '@/types';

// Helper function to extract recommendations from evaluations
function extractRecommendationsFromEvaluations(
  evaluations: BackendEvaluation[],
  student: Student | null
): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const evalData of evaluations) {
    // Extract from recommendations array
    if (evalData.recommendations && evalData.recommendations.length > 0) {
      for (const rec of evalData.recommendations) {
        const skillId = rec.skillName.toLowerCase().replace(/\s+/g, '-');
        recs.push({
          id: rec.id || `${evalData.studentId}-${evalData.jobVersion?.jobId || 'job'}-${skillId}`,
          studentId: evalData.studentId,
          jobId: evalData.jobVersion?.jobId || '',
          skill: {
            id: skillId,
            name: rec.skillName,
            category: 'Unknown',
          },
          priority: rec.priority as 'high' | 'medium' | 'low',
          currentMatchScore: evalData.overallScore || 0,
          projectedMatchScore: Math.round((evalData.overallScore || 0) + (rec.potentialLift || 0)),
          estimatedTimeWeeks: rec.estimatedWeeks || 5,
          steps: rec.steps || [],
          resources: [],
        });
      }
    }

    // Extract from requirement matches (missing skills with high impact)
    if (evalData.requirementMatches) {
      for (const match of evalData.requirementMatches) {
        if (match.matchState === 'MISSING' && match.requirement && match.contribution > 0.1) {
          // Check if this is already covered by existing recommendations
          const existing = recs.find(
            (r) => r.skill.name.toLowerCase() === match.requirement?.label.toLowerCase()
          );
          if (!existing && match.requirement) {
            recs.push({
              id: match.id,
              studentId: evalData.studentId,
              jobId: evalData.jobVersion?.jobId || '',
              skill: {
                id: match.requirement.id,
                name: match.requirement.label,
                category: 'Unknown',
              },
              priority: 'high',
              currentMatchScore: evalData.overallScore || 0,
              projectedMatchScore: Math.round((evalData.overallScore || 0) + (match.contribution * 100)),
              estimatedTimeWeeks: 4,
              steps: [`Learn ${match.requirement.label} fundamentals`, `Practice with hands-on projects`],
              resources: [],
            });
          }
        }
      }
    }
  }

  // Sort by priority (high first) then by potential improvement
  recs.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const improvementDiff = b.projectedMatchScore - a.projectedMatchScore;
    if (improvementDiff !== 0) return improvementDiff;
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // If no recommendations from evaluations, create default ones based on common skill gaps
  if (recs.length === 0 && student) {
    return [
      {
        id: 'rec-default-1',
        studentId: student.id,
        skill: { id: 'sk-spring', name: 'Spring Boot', category: 'Framework' },
        priority: 'high',
        currentMatchScore: 72,
        projectedMatchScore: 86,
        estimatedTimeWeeks: 5,
        steps: [
          'Complete Spring Boot fundamentals course',
          'Build a CRUD REST API project',
          'Add authentication (JWT)',
          'Connect to SQL database with JPA/Hibernate',
          'Deploy project and link on resume',
        ],
        resources: [],
      },
      {
        id: 'rec-default-2',
        studentId: student.id,
        skill: { id: 'sk-dsa', name: 'Data Structures & Algorithms', category: 'CS Fundamentals' },
        priority: 'medium',
        currentMatchScore: 72,
        projectedMatchScore: 78,
        estimatedTimeWeeks: 6,
        steps: [
          'Review complexity analysis',
          'Solve 30 medium LeetCode problems',
          'Complete arrays, trees, and graphs tracks',
          'Practice 5 timed mock interview sessions',
        ],
        resources: [],
      },
    ];
  }

  return recs;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evaluationsData, profileData] = await Promise.all([
          fetchMyEvaluations(),
          fetchMyProfile(),
        ]);

        const evaluations = evaluationsData?.items || [];
        const frontendStudent = profileData ? convertToFrontendStudent(profileData) : null;

        setStudent(frontendStudent);

        // Extract recommendations from evaluations
        const recs = extractRecommendationsFromEvaluations(evaluations, frontendStudent);
        setRecommendations(recs);

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <LoadingState label="Loading recommendations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <ErrorState title="Failed to load recommendations" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <EmptyState
          title="No profile found"
          description="Your student profile could not be loaded. Please try again later."
        />
      </div>
    );
  }

  // Get current match score and projected score
  const currentMatchScore = recommendations.length > 0 
    ? Math.max(...recommendations.map(r => r.currentMatchScore))
    : 0;
  const projectedMatchScore = recommendations.length > 0
    ? Math.max(...recommendations.map(r => r.projectedMatchScore))
    : 0;

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
            {recommendations.length > 0 ? recommendations[0].skill.name + ' & Skill Development Track' : 'Backend Engineering & SDE-1 Readiness Track'}
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Current Match: <strong className="text-text">{currentMatchScore}%</strong> • Projected Target: <strong className="text-success">{projectedMatchScore}%+</strong> (Estimated {recommendations.length > 0 ? recommendations[0].estimatedTimeWeeks : 5} weeks)
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
        {recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))
        ) : (
          <EmptyState
            title="No recommendations available"
            description="Complete some evaluations first to get personalized recommendations."
          />
        )}
      </div>
    </div>
  );
}
