'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';

export default function PlacementReportsPage() {
  const reports = [
    {
      id: 'rep-01',
      title: 'Departmental Skill Deficit & Curriculum Intervention Report',
      category: 'Curriculum & Training',
      generatedDate: '2026-08-14',
      size: '2.4 MB',
      status: 'Ready',
    },
    {
      id: 'rep-02',
      title: 'Tier-1 Recruitment Drive Conversion & Shortlist Audit',
      category: 'Placement Operations',
      generatedDate: '2026-08-12',
      size: '1.8 MB',
      status: 'Ready',
    },
    {
      id: 'rep-03',
      title: 'AI Matching Model Explainability & Compliance Audit Log',
      category: 'Governance & Auditing',
      generatedDate: '2026-08-10',
      size: '4.1 MB',
      status: 'Ready',
    },
    {
      id: 'rep-04',
      title: 'Candidate Eligibility & Backlog Verification Master Sheet',
      category: 'Academic Records',
      generatedDate: '2026-08-01',
      size: '950 KB',
      status: 'Ready',
    },
  ];

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

        <GlassButton variant="primary" size="md">
          + Generate Custom Audit Report
        </GlassButton>
      </div>

      {/* Reports Listing */}
      <div className="space-y-4">
        {reports.map((rep) => (
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
        ))}
      </div>
    </div>
  );
}
