'use client';

import React, { useState, useEffect } from 'react';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassTabs } from '@/components/ui/GlassTabs';
import { JobCard } from '@/components/product/JobCard';
import { EmptyState } from '@/components/states';
import { Skeleton } from '@/components/ui/Skeleton';
import { fetchJobs, fetchMyApplications, applyToJob, convertToFrontendJob, convertToFrontendApplication } from '@/services/student-api';
import type { Job, Application, MatchResult } from '@/types';
import type { BackendJob, BackendApplication } from '@/types/api';

export default function StudentJobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matchResults, setMatchResults] = useState<Map<string, MatchResult>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsResult, appsResult] = await Promise.all([
          fetchJobs({ pageSize: 50, status: 'PUBLISHED' }),
          fetchMyApplications({ pageSize: 50 }),
        ]);

        const frontendJobs = jobsResult.items.map(convertToFrontendJob);
        const frontendApps = appsResult.items.map(convertToFrontendApplication);
        
        // Create match results map from applications
        const matchesMap = new Map<string, MatchResult>();
        frontendApps.forEach((app) => {
          if (app.matchResult) {
            matchesMap.set(app.jobId, app.matchResult);
          }
        });

        setJobs(frontendJobs);
        setApplications(frontendApps);
        setMatchResults(matchesMap);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const appliedIds = applications.map((a) => a.jobId);

  const tabs = [
    { id: 'all', label: 'All Jobs', badge: jobs.length },
    { id: 'recommended', label: 'Top Matches (70%+)' },
    { id: 'eligible', label: 'Eligible Only' },
    { id: 'applied', label: 'Applied', badge: appliedIds.length },
  ];

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    // Search query filter
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requiredSkills.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab filter
    const match = matchResults.get(job.id);

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

  const handleApply = async (jobId: string) => {
    try {
      const newApp = await applyToJob(jobId);
      const frontendApp = convertToFrontendApplication(newApp);
      setApplications([...applications, frontendApp]);
      
      // Update match results if available
      if (frontendApp.matchResult) {
        setMatchResults(new Map(matchResults.set(jobId, frontendApp.matchResult)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply to job');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
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
            const matchResult = matchResults.get(job.id);
            const isApplied = appliedIds.includes(job.id);

            return (
              <JobCard
                key={job.id}
                job={job}
                matchResult={matchResult || undefined}
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
