'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { SkillChip } from '@/components/product/SkillChip';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchAllStudents,
  convertToFrontendStudent,
} from '@/services/placement-api';
import type { BackendStudentList, BackendStudent } from '@/types/api';
import type { Student } from '@/types';
import { formatCgpa } from '@/lib/utils';

export default function PlacementStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const result = await fetchAllStudents({ pageSize: 100 });
        const frontendStudents = result?.items.map(convertToFrontendStudent) || [];
        setStudents(frontendStudents);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students');
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <LoadingState label="Loading students..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <ErrorState title="Failed to load students" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const filtered = students.filter((stu) => {
    const matchesSearch =
      stu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stu.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stu.skills.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (deptFilter !== 'all' && stu.department !== deptFilter) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Student Roster & Profiles
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Directory of registered students with verified academic credentials, parsed skills, and readiness scores.
          </p>
        </div>

        <GlassButton variant="secondary" size="md">
          Export Roster CSV
        </GlassButton>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <GlassInput
            placeholder="Search student by name, roll number, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="dept-filter" className="text-caption text-text-muted font-medium whitespace-nowrap">
            Department:
          </label>
          <select
            id="dept-filter"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-10 px-3 py-2 rounded-sm border border-border bg-surface text-text text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <GlassCard variant="surface" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" role="table">
            <thead className="bg-canvas-subtle border-b border-border-subtle text-caption uppercase tracking-wider text-text-muted">
              <tr>
                <th className="py-3 px-4 font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">Roll No</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">CGPA</th>
                <th className="py-3 px-4 font-semibold">Readiness</th>
                <th className="py-3 px-4 font-semibold">Verified Skills</th>
                <th className="py-3 px-4 font-semibold text-right">Backlogs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonTableRow key={i} />
                  ))
                : filtered.map((stu) => (
                    <tr key={stu.id} className="hover:bg-surface-raised/50 transition-base">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text">{stu.name}</div>
                        <div className="text-caption text-text-muted">{stu.email}</div>
                      </td>
                      <td className="py-3 px-4 text-text-muted tabular">{stu.rollNumber}</td>
                      <td className="py-3 px-4 text-text-muted">{stu.department}</td>
                      <td className="py-3 px-4 font-semibold text-text tabular">{formatCgpa(stu.cgpa)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold tabular ${
                            stu.placementReadiness >= 80
                              ? 'text-success'
                              : stu.placementReadiness >= 60
                              ? 'text-warning'
                              : 'text-danger'
                          }`}
                        >
                          {stu.placementReadiness}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {stu.skills.slice(0, 3).map((sk) => (
                            <SkillChip key={sk.id} skill={sk} size="sm" />
                          ))}
                          {stu.skills.length > 3 && (
                            <span className="text-caption text-text-muted self-center">
                              +{stu.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {stu.activeBacklogs === 0 ? (
                          <GlassBadge variant="success" size="sm">
                            0 Active
                          </GlassBadge>
                        ) : (
                          <GlassBadge variant="danger" size="sm">
                            {stu.activeBacklogs} Active
                          </GlassBadge>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
