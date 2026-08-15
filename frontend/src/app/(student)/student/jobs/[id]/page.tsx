'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge, EligibilityBadge } from '@/components/ui/GlassBadge';
import { MatchScore } from '@/components/product/MatchScore';
import { SkillChip } from '@/components/product/SkillChip';
import { ResumeComparison } from '@/components/product/ResumeComparison';
import { useToast } from '@/components/ui/Toast';
import { currentStudent } from '@/data/students';
import { mockJobs } from '@/data/jobs';
import { mockMatchResults, mockApplications } from '@/data/index';
import { formatDate } from '@/lib/utils';

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const job = mockJobs.find((j) => j.id === resolvedParams.id);

  const [applied, setApplied] = useState(
    mockApplications.some((a) => a.jobId === resolvedParams.id)
  );

  if (!job) {
    notFound();
  }

  const { toast } = useToast();

  const matchResult = mockMatchResults.find((m) => m.jobId === job.id) || {
    jobId: job.id,
    studentId: currentStudent.id,
    overallScore: 68,
    confidenceScore: 82,
    eligibilityStatus: 'eligible' as const,
    coveragePercent: 68,
    strongSkills: currentStudent.skills.slice(0, 3).map((s) => ({ ...s, status: 'strong' as const })),
    partialSkills: [],
    missingSkills: job.requiredSkills.filter(
      (r) => !currentStudent.skills.some((s) => s.name.toLowerCase() === r.name.toLowerCase())
    ).map((s) => ({ ...s, status: 'missing' as const })),
    matchSummary: 'Good alignment on basic qualifications with high confidence.',
    analysisVersion: '2.1.0',
    generatedAt: new Date().toISOString(),
    requiresHumanReview: false,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href="/student/jobs"
        className="inline-flex items-center gap-1.5 text-caption text-text-muted hover:text-text transition-base"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Placement Drives
      </Link>

      {/* Main Job Hero Card */}
      <GlassCard variant="surface" padding="lg" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <span className="text-caption font-semibold uppercase tracking-wider text-text-muted">
              {job.company}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text mt-1">
              {job.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-sm text-text-muted">
              <span>{job.location}</span>
              <span>•</span>
              <span className="capitalize">{job.workMode}</span>
              <span>•</span>
              <span className="capitalize">{job.jobType}</span>
              {job.salary && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-text tabular">{job.salary}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <MatchScore
              score={matchResult.overallScore}
              confidence={matchResult.confidenceScore}
              eligibility={matchResult.eligibilityStatus}
              size="lg"
            />
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-caption text-text-muted">
            <EligibilityBadge status={matchResult.eligibilityStatus} />
            <span>Deadline: <strong className="text-text">{formatDate(job.deadline)}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/student/match?jobId=${job.id}`}>
              <GlassButton variant="secondary" size="md">
                Detailed Match Breakdown
              </GlassButton>
            </Link>
            <GlassButton
              variant={applied ? 'secondary' : 'primary'}
              size="md"
              disabled={applied}
              onClick={() => {
                setApplied(true);
                toast('Application submitted successfully!', 'success');
              }}
            >
              {applied ? 'Application Submitted ✓' : 'Apply for Role'}
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Role Description & Requirements Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Responsibilities */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard variant="surface" padding="md" className="space-y-4">
            <h2 className="text-title font-bold text-text">About the Role</h2>
            <p className="text-sm text-text-muted leading-relaxed">{job.description}</p>

            <h3 className="text-title font-bold text-text pt-2">Key Responsibilities</h3>
            <ul className="space-y-2 list-disc list-inside text-sm text-text-muted">
              {job.responsibilities.map((resp, i) => (
                <li key={i} className="leading-relaxed">
                  <span className="text-text">{resp}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Skill Requirements */}
          <GlassCard variant="surface" padding="md" className="space-y-4">
            <h2 className="text-title font-bold text-text">Skill Requirements</h2>

            <div>
              <div className="text-caption text-text-faint font-semibold uppercase tracking-wider mb-2">
                Mandatory Skills
              </div>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((sk) => (
                  <SkillChip key={sk.id} skill={sk} size="md" />
                ))}
              </div>
            </div>

            {job.preferredSkills.length > 0 && (
              <div className="pt-2 border-t border-border-subtle">
                <div className="text-caption text-text-faint font-semibold uppercase tracking-wider mb-2">
                  Preferred / Nice-to-Have Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.preferredSkills.map((sk) => (
                    <SkillChip key={sk.id} skill={sk} size="md" />
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Matrix comparison */}
          <ResumeComparison
            job={job}
            student={currentStudent}
            matchResult={matchResult}
          />
        </div>

        {/* Right 1 Col: Eligibility Criteria */}
        <div className="space-y-6">
          <GlassCard variant="surface" padding="md" className="space-y-4">
            <h2 className="text-title font-bold text-text">Eligibility Criteria</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-text-muted">Min CGPA</span>
                <span className="font-semibold text-text tabular">{job.eligibility.minCgpa} (Your: {currentStudent.cgpa})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-text-muted">Allowed Depts</span>
                <span className="font-semibold text-text text-right text-xs max-w-[150px]">
                  {job.eligibility.allowedDepartments.join(', ')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-text-muted">Allowed Programs</span>
                <span className="font-semibold text-text">{job.eligibility.allowedPrograms.join(', ')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-text-muted">Max Backlogs</span>
                <span className="font-semibold text-text tabular">{job.eligibility.maxBacklogs}</span>
              </div>
            </div>

            <div className="pt-2">
              <GlassBadge variant="success" size="md" className="w-full justify-center">
                ✓ You Meet All Eligibility Criteria
              </GlassBadge>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
