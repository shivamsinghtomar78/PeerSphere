'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import { fetchReports } from '@/services/placement-api';
import { formatDate } from '@/lib/utils';

export default function PlacementReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reports on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchReports({ pageSize: 50 });
        setReports(result?.items || []);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <LoadingState label="Loading reports..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <ErrorState title="Failed to load reports" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Format reports data for display
  const formattedReports = reports.map((report: any) => ({
    id: report.id || `${report.title || report.name || 'report'}-${report.generatedAt || report.createdAt || ''}`,
    title: report.title || report.name || 'Untitled Report',
    category: report.category || report.type || 'General',
    generatedDate: report.generatedAt || report.createdAt || 'Unknown',
    size: report.size ? report.size : report.sizeBytes ? `${Math.round(report.sizeBytes / 1024 / 1024 * 10) / 10} MB` : 'N/A',
    status: report.status || 'Ready',
  }));

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Placement Reports & Audit Trails
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Official institutional exports, compliance records, and skill gap advisory documentation.
          </p>
        </div>

        <GlassButton variant="primary" size="md" onClick={() => window.print()}>
          Export Reports PDF
        </GlassButton>
      </div>

      {/* Reports Listing */}
      <div className="space-y-4">
        {formattedReports.length > 0 ? (
          formattedReports.map((rep) => (
            <GlassCard key={rep.id} variant="surface" padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <GlassBadge variant="default" size="sm">
                    {rep.category}
                  </GlassBadge>
                  <span className="text-caption text-text-muted">Generated: {rep.generatedDate}</span>
                </div>
                <h3 className="text-base font-bold text-text mt-1.5">{rep.title}</h3>
                <p className="text-caption text-text-faint mt-0.5">File size: {rep.size} • Format: PDF / CSV Bundle</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <GlassButton variant="secondary" size="sm">
                  Download PDF
                </GlassButton>
                <GlassButton variant="ghost" size="sm">
                  View Summary
                </GlassButton>
              </div>
            </GlassCard>
          ))
        ) : (
          <EmptyState
            title="No reports available"
            description="There are no generated reports to display."
          />
        )}
      </div>
    </div>
  );
}
