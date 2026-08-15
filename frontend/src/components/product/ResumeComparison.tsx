'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { SkillChip } from '@/components/product/SkillChip';
import type { Job, Student, MatchResult } from '@/types';

interface ResumeComparisonProps {
  job: Job;
  student: Student;
  matchResult: MatchResult;
  className?: string;
}

export function ResumeComparison({
  job,
  student,
  matchResult,
  className,
}: ResumeComparisonProps) {
  // Build comparison rows from required + preferred skills
  const allJobSkills = [...job.requiredSkills, ...job.preferredSkills];

  return (
    <GlassCard variant="surface" padding="none" className={cn('overflow-hidden', className)}>
      <div className="p-4 border-b border-border-subtle bg-surface-raised flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-title text-text font-semibold">Resume vs Job Requirements Matrix</h4>
          <p className="text-caption text-text-muted">
            Comparing <strong className="text-text">{student.name}</strong> against <strong className="text-text">{job.title} at {job.company}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Match Score:</span>
          <span className="font-bold text-text tabular">{matchResult.overallScore}%</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm" role="table">
          <thead className="bg-canvas-subtle border-b border-border-subtle text-caption uppercase tracking-wider text-text-muted">
            <tr>
              <th className="py-3 px-4 font-semibold">Job Requirement</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Type</th>
              <th className="py-3 px-4 font-semibold">Student Profile Evidence</th>
              <th className="py-3 px-4 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {allJobSkills.map((sk) => {
              const isRequired = job.requiredSkills.some((r) => r.id === sk.id);
              const isStrong = matchResult.strongSkills.some(
                (s) => s.name.toLowerCase() === sk.name.toLowerCase()
              );
              const isPartial = matchResult.partialSkills.some(
                (s) => s.name.toLowerCase() === sk.name.toLowerCase()
              );
              const status = isStrong ? 'strong' : isPartial ? 'partial' : 'missing';

              const studentEvidence = student.skills.find(
                (s) => s.name.toLowerCase() === sk.name.toLowerCase()
              );

              return (
                <tr key={sk.id} className="hover:bg-surface-raised/50 transition-base">
                  <td className="py-3 px-4 font-medium text-text">{sk.name}</td>
                  <td className="py-3 px-4 text-text-muted">{sk.category}</td>
                  <td className="py-3 px-4 text-text-faint text-caption font-medium">
                    {isRequired ? 'Required' : 'Preferred'}
                  </td>
                  <td className="py-3 px-4 text-text-muted">
                    {studentEvidence ? (
                      <span className="text-text font-medium">
                        Found in profile
                        {studentEvidence.confidence ? ` (~${studentEvidence.confidence}% confidence)` : ''}
                      </span>
                    ) : (
                      <span className="text-text-faint italic">No mention found in parsed resume</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <SkillChip skill={sk.name} status={status} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden divide-y divide-border-subtle p-2">
        {allJobSkills.map((sk) => {
          const isRequired = job.requiredSkills.some((r) => r.id === sk.id);
          const isStrong = matchResult.strongSkills.some(
            (s) => s.name.toLowerCase() === sk.name.toLowerCase()
          );
          const isPartial = matchResult.partialSkills.some(
            (s) => s.name.toLowerCase() === sk.name.toLowerCase()
          );
          const status = isStrong ? 'strong' : isPartial ? 'partial' : 'missing';
          const studentEvidence = student.skills.find(
            (s) => s.name.toLowerCase() === sk.name.toLowerCase()
          );

          return (
            <div key={sk.id} className="p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-text text-sm">{sk.name}</span>
                <SkillChip skill={sk.name} status={status} size="sm" />
              </div>
              <div className="flex items-center gap-2 text-caption text-text-muted">
                <span>{isRequired ? 'Required' : 'Preferred'}</span>
                <span>•</span>
                <span>{sk.category}</span>
              </div>
              <div className="text-caption text-text-faint">
                {studentEvidence ? 'Evidence present on profile' : 'Missing from parsed resume'}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
