'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassDialog } from '@/components/ui/GlassDialog';
import { SkillChip } from '@/components/product/SkillChip';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchAllJobs,
  createJob,
  publishJob,
  closeJob,
  convertToFrontendJob,
} from '@/services/placement-api';
import { fetchJobs } from '@/services/student-api';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import type { Job } from '@/types';
import type { BackendJob } from '@/types/api';

export default function PlacementJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    company: '',
    title: '',
    location: '',
    workMode: 'hybrid' as const,
    jobType: 'full-time' as const,
    salary: '',
    minCgpa: '7.5',
    maxBacklogs: '0',
    allowedDepartments: 'Computer Science, Information Technology',
    requiredSkills: 'Java, Spring Boot, REST API, SQL',
    preferredSkills: 'Docker, AWS',
    description: '',
    deadline: '2026-09-30',
  });

  // Fetch jobs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobsData = await fetchAllJobs({ pageSize: 50 });
        const frontendJobs = jobsData?.items.map(convertToFrontendJob) || [];
        setJobs(frontendJobs);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <LoadingState label="Loading jobs..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <ErrorState title="Failed to load jobs" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const handlePublish = async (jobId: string) => {
    try {
      await publishJob(jobId);
      const jobsData = await fetchAllJobs({ pageSize: 50 });
      setJobs(jobsData?.items.map(convertToFrontendJob) || []);
      toast('Job published — matching triggered for eligible students', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to publish job', 'error');
    }
  };

  const handleClose = async (jobId: string) => {
    try {
      await closeJob(jobId);
      const jobsData = await fetchAllJobs({ pageSize: 50 });
      setJobs(jobsData?.items.map(convertToFrontendJob) || []);
      toast('Job drive closed', 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to close job', 'error');
    }
  };

  const handleCreate = async () => {
    try {
      // Create backend job data
      const backendJobData = {
        title: formData.title,
        company: formData.company,
        location: formData.location || 'Bengaluru, Karnataka',
        workMode: formData.workMode.toUpperCase(),
        jobType: formData.jobType.toUpperCase().replace('-', '_'),
        salary: formData.salary || '₹10–16 LPA',
        minCgpa: parseFloat(formData.minCgpa) || 7.0,
        maxBacklogs: parseInt(formData.maxBacklogs) || 0,
        allowedDepartments: formData.allowedDepartments.split(',').map((d: string) => d.trim()),
        allowedPrograms: ['B.Tech', 'M.Tech'],
        description: formData.description || 'Full-time campus placement role.',
        deadline: `${formData.deadline}T23:59:59.000Z`,
        requiredSkills: formData.requiredSkills
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
        preferredSkills: formData.preferredSkills
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
      };

      await createJob(backendJobData);

      const jobsData = await fetchAllJobs({ pageSize: 50 });
      setJobs(jobsData?.items.map(convertToFrontendJob) || []);
      setIsWizardOpen(false);
      setStep(1);
      setFormData({
        company: '',
        title: '',
        location: '',
        workMode: 'hybrid',
        jobType: 'full-time',
        salary: '',
        minCgpa: '7.5',
        maxBacklogs: '0',
        allowedDepartments: 'Computer Science, Information Technology',
        requiredSkills: 'Java, Spring Boot, REST API, SQL',
        preferredSkills: 'Docker, AWS',
        description: '',
        deadline: '2026-09-30',
      });
      toast('Job created successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job';
      toast(message, 'error');
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Campus Placement Drives & Specifications
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Publish structured Job Descriptions (JDs), set deterministic eligibility constraints, and configure AI skill matching.
          </p>
        </div>

        <GlassButton variant="primary" size="md" onClick={() => setIsWizardOpen(true)}>
          + Create New Job Post
        </GlassButton>
      </div>

      {/* Jobs Listing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <GlassCard key={job.id} variant="surface" padding="md" className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-text-muted">
                  {job.company}
                </span>
                <h3 className="text-lg font-bold text-text mt-0.5">{job.title}</h3>
                <div className="flex items-center gap-2 text-caption text-text-muted mt-1 flex-wrap">
                  <span>{job.location}</span>
                  <span>•</span>
                  <span className="capitalize">{job.workMode}</span>
                  <span>•</span>
                  <span>{job.salary}</span>
                </div>
              </div>

              <GlassBadge variant={job.status === 'published' ? 'success' : 'default'} size="sm" dot>
                {job.status.toUpperCase()}
              </GlassBadge>
            </div>

            {/* Skills */}
            <div>
              <div className="text-caption text-text-faint font-medium mb-1.5">Required Skills:</div>
              <div className="flex flex-wrap gap-1">
                {job.requiredSkills.map((sk) => (
                  <SkillChip key={sk.id} skill={sk} size="sm" />
                ))}
              </div>
            </div>

            {/* Footer Stats & Actions */}
            <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3 text-caption text-text-muted">
              <div>
                <span>Applications: <strong className="text-text">{job.applicationCount ?? 0}</strong></span>
                <span className="mx-2">•</span>
                <span>Deadline: {formatDate(job.deadline)}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {job.status === 'draft' && (
                  <GlassButton variant="primary" size="sm" onClick={() => handlePublish(job.id)}>
                    Publish
                  </GlassButton>
                )}
                {job.status === 'published' && (
                  <GlassButton variant="ghost" size="sm" onClick={() => handleClose(job.id)}>
                    Close
                  </GlassButton>
                )}
                <GlassButton href="/placement/candidates" variant="secondary" size="sm">
                  View Candidates
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Multi-step Job Creation Wizard Dialog */}
      <GlassDialog
        open={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Create Job Posting Specification"
        description={`Step ${step} of 4: ${
          step === 1
            ? 'Company & Role Details'
            : step === 2
            ? 'Eligibility Constraints'
            : step === 3
            ? 'Skill Requirements & Taxonomy'
            : 'Review & Publish'
        }`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            {step > 1 ? (
              <GlassButton variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                ← Back
              </GlassButton>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <GlassButton variant="primary" size="sm" onClick={() => setStep((s) => s + 1)}>
                Continue →
              </GlassButton>
            ) : (
              <GlassButton variant="primary" size="sm" onClick={handleCreate}>
                Publish Drive to Campus ✓
              </GlassButton>
            )}
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {/* Step 1: Company & Role */}
          {step === 1 && (
            <div className="space-y-3">
              <GlassInput
                label="Company Name *"
                placeholder="e.g. Google, Microsoft, ABC Tech..."
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
              <GlassInput
                label="Job / Role Title *"
                placeholder="e.g. Backend Software Engineer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <GlassInput
                  label="Location"
                  placeholder="e.g. Bengaluru / Hybrid"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <GlassInput
                  label="Compensation Package"
                  placeholder="e.g. ₹12–18 LPA"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Eligibility */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <GlassInput
                  label="Minimum CGPA Threshold *"
                  type="number"
                  step="0.1"
                  value={formData.minCgpa}
                  onChange={(e) => setFormData({ ...formData, minCgpa: e.target.value })}
                />
                <GlassInput
                  label="Maximum Allowed Active Backlogs *"
                  type="number"
                  value={formData.maxBacklogs}
                  onChange={(e) => setFormData({ ...formData, maxBacklogs: e.target.value })}
                />
              </div>
              <GlassInput
                label="Eligible Academic Departments (comma-separated)"
                value={formData.allowedDepartments}
                onChange={(e) => setFormData({ ...formData, allowedDepartments: e.target.value })}
              />
              <GlassInput
                label="Application Deadline (YYYY-MM-DD)"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div className="space-y-3">
              <GlassInput
                label="Mandatory Technical Skills (comma-separated) *"
                placeholder="e.g. Java, Spring Boot, REST API, SQL, DSA"
                value={formData.requiredSkills}
                onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                hint="Used for zero-hallucination semantic matching engine."
              />
              <GlassInput
                label="Preferred / Bonus Skills (comma-separated)"
                placeholder="e.g. Docker, AWS, Kubernetes"
                value={formData.preferredSkills}
                onChange={(e) => setFormData({ ...formData, preferredSkills: e.target.value })}
              />
              <div className="space-y-1.5">
                <label className="text-label text-text">Job Description Text</label>
                <textarea
                  rows={3}
                  className="w-full p-2.5 text-sm rounded-sm border border-border bg-surface text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
                  placeholder="Paste or write detailed role description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-md bg-canvas-subtle border border-border-subtle space-y-1.5">
                <p><strong>Company:</strong> {formData.company || 'Not set'}</p>
                <p><strong>Role:</strong> {formData.title || 'Not set'}</p>
                <p><strong>Compensation:</strong> {formData.salary || 'Standard'}</p>
                <p><strong>Eligibility:</strong> Min CGPA {formData.minCgpa}, Max Backlogs {formData.maxBacklogs}</p>
                <p><strong>Mandatory Skills:</strong> {formData.requiredSkills}</p>
              </div>
              <p className="text-caption text-text-muted">
                Publishing will trigger immediate automated eligibility filtering and profile matching across all registered students.
              </p>
            </div>
          )}
        </div>
      </GlassDialog>
    </div>
  );
}
