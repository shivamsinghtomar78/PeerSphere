'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore } from '@/components/product/MatchScore';
import { mockApplications, mockMatchResults } from '@/data/index';
import { mockStudents } from '@/data/students';
import { mockJobs } from '@/data/jobs';
import { formatDate, applicationStatusLabel } from '@/lib/utils';

export default function PlacementApplicationsPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Campus Placement Applications Roster
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Review incoming candidate applications across all active recruitment drives.
          </p>
        </div>

        <GlassButton variant="secondary" size="md">
          Export Shortlist CSV
        </GlassButton>
      </div>

      {/* Applications Table */}
      <GlassCard variant="surface" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" role="table">
            <thead className="bg-canvas-subtle border-b border-border-subtle text-caption uppercase tracking-wider text-text-muted">
              <tr>
                <th className="py-3 px-4 font-semibold">Candidate</th>
                <th className="py-3 px-4 font-semibold">Job Drive</th>
                <th className="py-3 px-4 font-semibold">Match Score</th>
                <th className="py-3 px-4 font-semibold">Eligibility</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Applied Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {mockApplications.map((app) => {
                const student = mockStudents.find((s) => s.id === app.studentId) || mockStudents[0];
                const job = mockJobs.find((j) => j.id === app.jobId) || mockJobs[0];
                const match = mockMatchResults.find((m) => m.studentId === student.id) || mockMatchResults[0];

                const statusBadge =
                  app.status === 'shortlisted' ? 'success' : app.status === 'under_review' ? 'warning' : 'default';

                return (
                  <tr key={app.id} className="hover:bg-surface-raised/50 transition-base">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text">
                        <Link href={`/placement/candidates/${student.id}`}>{student.name}</Link>
                      </div>
                      <div className="text-caption text-text-muted">{student.rollNumber} • {student.department}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-text">{job.title}</div>
                      <div className="text-caption text-text-muted">{job.company}</div>
                    </td>

                    <td className="py-3 px-4">
                      <MatchScore score={match.overallScore} size="sm" showDetails={false} />
                    </td>

                    <td className="py-3 px-4">
                      <EligibilityBadge status={match.eligibilityStatus} />
                    </td>

                    <td className="py-3 px-4">
                      <GlassBadge variant={statusBadge as any} size="sm" dot>
                        {applicationStatusLabel(app.status)}
                      </GlassBadge>
                    </td>

                    <td className="py-3 px-4 text-text-muted tabular">
                      {formatDate(app.appliedAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/placement/candidates/${student.id}`}>
                          <GlassButton variant="ghost" size="sm">
                            Inspect
                          </GlassButton>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
