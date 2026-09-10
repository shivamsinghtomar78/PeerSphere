'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassDialog } from '@/components/ui/GlassDialog';
import { useToast } from '@/components/ui/Toast';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchReports,
  generateReport,
  downloadReportCsv,
  type GeneratedReport,
} from '@/services/placement-api';
import { formatDate } from '@/lib/utils';

export default function PlacementReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Which report id is currently being generated, and for which action
  const [busy, setBusy] = useState<{ id: string; action: 'view' | 'download' } | null>(null);
  const [summary, setSummary] = useState<GeneratedReport | null>(null);

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

  const handleView = async (reportId: string) => {
    try {
      setBusy({ id: reportId, action: 'view' });
      setSummary(await generateReport(reportId));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to generate report', 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      setBusy({ id: reportId, action: 'download' });
      const report = await generateReport(reportId);
      downloadReportCsv(report);
      toast('Report downloaded as CSV', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to generate report', 'error');
    } finally {
      setBusy(null);
    }
  };

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
    description: report.description || '',
    generatedDate: report.generatedAt || report.createdAt || 'Unknown',
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
            Every figure is generated live from the evaluation database.
          </p>
        </div>
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
                  <span className="text-caption text-text-muted">Data as of: generated on demand</span>
                </div>
                <h3 className="text-base font-bold text-text mt-1.5">{rep.title}</h3>
                <p className="text-caption text-text-faint mt-0.5">
                  {rep.description || 'CSV export · printable summary'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(rep.id)}
                  disabled={busy !== null}
                >
                  {busy?.id === rep.id && busy?.action === 'download' ? 'Generating…' : 'Download CSV'}
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(rep.id)}
                  disabled={busy !== null}
                >
                  {busy?.id === rep.id && busy?.action === 'view' ? 'Generating…' : 'View Summary'}
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

      {/* Summary dialog */}
      <GlassDialog
        open={summary !== null}
        onClose={() => setSummary(null)}
        title={summary?.title ?? 'Report summary'}
      >
        {summary && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <GlassBadge variant="default" size="sm">{summary.category}</GlassBadge>
              <span className="text-caption text-text-muted">
                Generated {formatDate(summary.generatedAt)} · live data
              </span>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {summary.sections.map((section) => (
                <div key={section.heading}>
                  <h3 className="text-caption font-semibold uppercase tracking-wider text-text-muted mb-2">
                    {section.heading}
                  </h3>
                  <dl className="space-y-1.5">
                    {section.rows.length > 0 ? (
                      section.rows.map((row, i) => (
                        <div
                          key={`${row.label}-${i}`}
                          className="flex items-baseline justify-between gap-4 text-sm border-b border-border-subtle pb-1.5 last:border-0"
                        >
                          <dt className="text-text-muted min-w-0">{row.label}</dt>
                          <dd className="font-semibold text-text text-right shrink-0 max-w-[55%]">{row.value}</dd>
                        </div>
                      ))
                    ) : (
                      <p className="text-caption text-text-faint">No records yet.</p>
                    )}
                  </dl>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
              <GlassButton variant="ghost" size="sm" onClick={() => setSummary(null)}>
                Close
              </GlassButton>
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => summary && downloadReportCsv(summary)}
              >
                Download CSV
              </GlassButton>
            </div>
          </div>
        )}
      </GlassDialog>
    </div>
  );
}
