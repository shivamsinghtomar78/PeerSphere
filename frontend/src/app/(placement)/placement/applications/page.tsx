'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore } from '@/components/product/MatchScore';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchAllApplications,
  fetchAllJobs,
  fetchAllStudents,
  convertToFrontendApplication,
  convertToFrontendJob,
  convertToFrontendStudent,
} from '@/services/placement-api';
import type { BackendApplicationList, BackendJobList, BackendStudentList } from '@/types/api';
import type { Application, Job, Student } from '@/types';
import { formatDate, applicationStatusLabel } from '@/lib/utils';

export default function PlacementApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsData, jobsData, studentsData] = await Promise.all([
          fetchAllApplications({ pageSize: 100 }),
          fetchAllJobs({ pageSize: 50 }),
          fetchAllStudents({ pageSize: 100 }),
        ]);

        const frontendApps = appsData?.items.map(convertToFrontendApplication) || [];
        const frontendJobs = jobsData?.items.map(convertToFrontendJob) || [];
        const frontendStudents = studentsData?.items.map(convertToFrontendStudent) || [];

        setApplications(frontendApps);
        setJobs(frontendJobs);
        setStudents(frontendStudents);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <LoadingState label="Loading applications..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <ErrorState title="Failed to load applications" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

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
              {applications.length > 0 ? (
                applications.map((app) => {
                const student = students.find((s) => s.id === app.studentId);
                const job = jobs.find((j) => j.id === app.jobId);

                if (!student || !job) return null;

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
                      {app.matchResult ? (
                        <MatchScore score={app.matchResult.overallScore} size="sm" showDetails={false} />
                      ) : (
                        <span className="text-caption text-text-muted">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {app.matchResult ? (
                        <EligibilityBadge status={app.matchResult.eligibilityStatus} />
                      ) : (
                        <GlassBadge variant="default" size="sm">Pending</GlassBadge>
                      )}
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
                        <GlassButton href={`/placement/candidates/${student.id}`} variant="ghost" size="sm">
                          Inspect
                        </GlassButton>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center">
                    <EmptyState
                      title="No applications found"
                      description="There are no applications to display."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
