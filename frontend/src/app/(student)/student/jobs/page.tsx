'use client';

import React, { useState } from 'react';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassTabs } from '@/components/ui/GlassTabs';
import { JobCard } from '@/components/product/JobCard';
import { EmptyState } from '@/components/states';
import { mockJobs } from '@/data/jobs';
import { mockMatchResults, mockApplications } from '@/data/index';

export default function StudentJobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [appliedIds, setAppliedIds] = useState<string[]>(
    mockApplications.map((a) => a.jobId)
  );

  const tabs = [
    { id: 'all', label: 'All Jobs', badge: mockJobs.length },
    { id: 'recommended', label: 'Top Matches (70%+)' },
    { id: 'eligible', label: 'Eligible Only' },
    { id: 'applied', label: 'Applied', badge: appliedIds.length },
  ];

  // Filter jobs
  const filteredJobs = mockJobs.filter((job) => {
    // Search query filter
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requiredSkills.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab filter
    const match = mockMatchResults.find((m) => m.jobId === job.id);

    if (activeTab === 'recommended') {
      return (match?.overallScore ?? 65) >= 70;
    }
    if (activeTab === 'eligible') {
      return match?.eligibilityStatus === 'eligible' || !match;
    }
    if (activeTab === 'applied') {
      return appliedIds.includes(job.id);
    }
    return true;
  });

  const handleApply = (jobId: string) => {
    if (!appliedIds.includes(jobId)) {
      setAppliedIds([...appliedIds, jobId]);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
          Campus Placement Openings
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Explore campus drives, check real-time AI skill match scores, and verify your eligibility before applying.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <GlassInput
            placeholder="Search by job title, company, or skill (e.g. Java, React)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
        </div>

        <GlassTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="glass"
        />
      </div>

      {/* Job Card Grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const matchResult = mockMatchResults.find((m) => m.jobId === job.id);
            const isApplied = appliedIds.includes(job.id);

            return (
              <JobCard
                key={job.id}
                job={job}
                matchResult={matchResult}
                viewMode="student"
                isApplied={isApplied}
                onApply={handleApply}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No openings found"
          description="Try adjusting your search terms or filter selection to find relevant placement drives."
        />
      )}
    </div>
  );
}
