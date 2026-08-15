'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { MatchScore } from '@/components/product/MatchScore';
import { mockApplications, mockMatchResults } from '@/data/index';
import { mockJobs } from '@/data/jobs';
import { formatDate, applicationStatusLabel } from '@/lib/utils';

export default function StudentApplicationsPage() {
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

        <Link href="/student/jobs">
          <GlassButton variant="primary" size="md">
            Browse New Drives
          </GlassButton>
        </Link>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {mockApplications.map((app) => {
          const job = mockJobs.find((j) => j.id === app.jobId);
          if (!job) return null;

          const matchResult = mockMatchResults.find((m) => m.jobId === job.id);

          const statusBadge =
            app.status === 'shortlisted'
              ? 'success'
              : app.status === 'under_review'
              ? 'warning'
              : app.status === 'rejected'
              ? 'danger'
              : 'default';

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
                    <div className="hidden sm:block">
                      <MatchScore
                        score={matchResult.overallScore}
                        confidence={matchResult.confidenceScore}
                        size="sm"
                        showDetails={false}
                      />
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
                  <Link href={`/student/match?jobId=${job.id}`}>
                    <GlassButton variant="ghost" size="sm">
                      Inspect Match Analysis
                    </GlassButton>
                  </Link>
                  <Link href={`/student/jobs/${job.id}`}>
                    <GlassButton variant="secondary" size="sm">
                      View Job Post
                    </GlassButton>
                  </Link>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
