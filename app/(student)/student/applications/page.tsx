'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { MatchScore } from '@/components/product/MatchScore';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/states';
import { fetchMyApplications, fetchJobs, convertToFrontendApplication, convertToFrontendJob } from '@/services/student-api';
import { formatDate, applicationStatusLabel } from '@/lib/utils';
import type { Job, Application } from '@/types';

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobsMap, setJobsMap] = useState<Map<string, Job>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsResult, jobsResult] = await Promise.all([
          fetchMyApplications({ pageSize: 50 }),
          fetchJobs({ pageSize: 50 }),
        ]);

        const frontendApps = appsResult.items.map(convertToFrontendApplication);
        const frontendJobs = jobsResult.items.map(convertToFrontendJob);
        
        const jobsMap = new Map<string, Job>();
        frontendJobs.forEach((job) => jobsMap.set(job.id, job));

        setApplications(frontendApps);
        setJobsMap(jobsMap);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'shortlisted') return 'success';
    if (status === 'under_review') return 'warning';
    if (status === 'rejected') return 'danger';
    return 'default';
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <p className="text-text-danger">Error: {error}</p>
          <button onClick={() => window.location.reload()} className="text-accent hover:underline mt-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            My Applications
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Track status, review submitted resumes, and check match audit trails across all campus drives.
          </p>
        </div>

        <GlassButton href="/student/jobs" variant="primary" size="md">
          Browse New Drives
        </GlassButton>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length > 0 ? (
          applications.map((app) => {
            const job = jobsMap.get(app.jobId);
            if (!job) return null;

            const matchResult = app.matchResult;
            const statusBadge = getStatusBadge(app.status);

            return (
              <GlassCard key={app.id} variant="surface" padding="md" className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-caption font-semibold uppercase tracking-wider text-text-muted">
                      {job.company}
                    </span>
                    <h3 className="text-lg font-bold text-text hover:text-accent transition-base">
                      <Link href={`/student/jobs/${job.id}`}>{job.title}</Link>
                    </h3>
                    <div className="flex items-center gap-2 text-caption text-text-muted mt-1 flex-wrap">
                      <span>Applied: <strong className="text-text">{formatDate(app.appliedAt)}</strong></span>
                      <span>•</span>
                      <span>Updated: {formatDate(app.updatedAt)}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {matchResult && (
                      <div className="hidden sm:flex flex-col items-center gap-1">
                        <MatchScore
                          score={matchResult.overallScore}
                          confidence={matchResult.confidenceScore}
                          size="sm"
                          showDetails={false}
                        />
                        <span className="text-caption text-text-faint whitespace-nowrap">
                          Score at evaluation
                        </span>
                      </div>
                    )}

                    <GlassBadge variant={statusBadge as any} size="md" dot>
                      {applicationStatusLabel(app.status)}
                    </GlassBadge>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-caption text-text-faint">
                    Application Reference ID: {app.id}
                  </span>

                  <div className="flex items-center gap-2">
                    <GlassButton href={`/student/match?jobId=${job.id}`} variant="ghost" size="sm">
                      Inspect Match Analysis
                    </GlassButton>
                    <GlassButton href={`/student/jobs/${job.id}`} variant="secondary" size="sm">
                      View Job Post
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            );
          })
        ) : (
          <EmptyState
            title="No applications yet"
            description="Browse available campus drives and apply to start your placement journey."
            action={<GlassButton href="/student/jobs" variant="primary">Browse Jobs</GlassButton>}
          />
        )}
      </div>
    </div>
  );
}
