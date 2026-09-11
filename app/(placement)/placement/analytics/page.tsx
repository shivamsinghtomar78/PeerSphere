'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { StatCard } from '@/components/product/StatCard';
import { LoadingState, ErrorState } from '@/components/states';
import {
  fetchPlacementStats,
  fetchSkillGapsAnalysis,
  fetchAllStudents,
  mapBackendSkillGapsToFrontend,
  convertToFrontendStudent,
} from '@/services/placement-api';
import type { BackendPlacementStats } from '@/types/api';
import type { SkillGapDistribution, Student } from '@/types';

// Priority → bar color mapping
const PRIORITY_COLOR: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6366f1',
};

const ACCENT_COLOR = '#6366f1';

export default function PlacementAnalyticsPage() {
  const [rawStats, setRawStats] = useState<BackendPlacementStats | null>(null);
  const [skillGapDistribution, setSkillGapDistribution] = useState<SkillGapDistribution[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, skillGapsData, studentsData] = await Promise.all([
          fetchPlacementStats(),
          fetchSkillGapsAnalysis(),
          fetchAllStudents({ pageSize: 100 }), // API caps pageSize at 100
        ]);

        const frontendSkillGaps = skillGapsData ? mapBackendSkillGapsToFrontend(skillGapsData) : [];
        const frontendStudents = studentsData?.items.map(convertToFrontendStudent) || [];

        setRawStats(statsData);
        setSkillGapDistribution(frontendSkillGaps);
        setStudents(frontendStudents);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <LoadingState label="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <ErrorState title="Failed to load analytics" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Calculate department readiness from students data
  const departmentReadiness: Array<{
    dept: string;
    fullName: string;
    readiness: number;
    students: number;
    eligible: number;
  }> = [];
  if (students.length > 0) {
    const deptMap: Record<string, { total: number; eligible: number; readinessSum: number }> = {};
    for (const student of students) {
      const dept = student.department || 'Other';
      if (!deptMap[dept]) {
        deptMap[dept] = { total: 0, eligible: 0, readinessSum: 0 };
      }
      deptMap[dept].total++;
      deptMap[dept].readinessSum += student.placementReadiness;
      if (student.placementReadiness >= 80) {
        deptMap[dept].eligible++;
      }
    }
    // Axis labels get ~60px — abbreviate long department names to initials
    // ("Information Technology" → "IT"); the tooltip carries the full name.
    const shortDeptLabel = (name: string) =>
      name.length <= 8
        ? name
        : name
            .split(/[\s&/]+/)
            .filter(Boolean)
            .map((word) => word[0].toUpperCase())
            .join('');
    for (const [dept, data] of Object.entries(deptMap)) {
      departmentReadiness.push({
        dept: shortDeptLabel(dept),
        fullName: dept,
        readiness: Math.round(data.readinessSum / data.total),
        students: data.total,
        eligible: data.eligible,
      });
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Placement Intelligence & Analytics
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Data-driven institutional analytics on student cohort readiness, skill deficit distributions, and hiring drive velocity.
          </p>
        </div>

        <GlassButton variant="primary" size="md" onClick={() => window.print()}>
          Export Analytics PDF Report
        </GlassButton>
      </div>

      {/* Top Stat Row — unchanged */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Average Match Score"
          value={rawStats?.avgMatchScore != null ? `${rawStats.avgMatchScore}%` : '—'}
          delta="+4.2% vs last batch"
          deltaType="positive"
          subtext="Cohort average across 12 drives"
        />
        <StatCard
          label="Mean AI Confidence"
          value={rawStats?.avgConfidence != null ? `${rawStats.avgConfidence}%` : '—'}
          subtext="High confidence threshold"
        />
        <StatCard
          label="Placement Conversion"
          value={rawStats?.placementRate != null ? `${rawStats.placementRate}%` : '—'}
          delta="18 Offers Extended"
          deltaType="positive"
          subtext="Early season trajectory"
        />
        <StatCard
          label="Critical Gap Rate"
          value="34%"
          delta="Spring Boot & REST API"
          deltaType="negative"
          subtext="Target for faculty workshops"
        />
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Skill Gap Distribution BarChart ─────────────────────── */}
        <GlassCard variant="surface" padding="md" className="space-y-4">
          <div>
            <h2 className="text-title font-bold text-text">Campus-Wide Skill Deficit Distribution</h2>
            <p className="text-caption text-text-muted">
              Identifies which missing technical competencies are hindering student placement conversion.
            </p>
          </div>

          <ResponsiveContainer
            width="100%"
            height={260}
            aria-label="Bar chart showing the number of students affected by each skill gap, coloured by priority"
          >
            <BarChart
              data={skillGapDistribution}
              margin={{ top: 8, right: 16, left: 0, bottom: 48 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="skill"
                tick={{ fontSize: 11, fill: 'var(--ps-text-muted, #94a3b8)' }}
                angle={-35}
                textAnchor="end"
                interval={0}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--ps-text-muted, #94a3b8)' }}
                tickLine={false}
                axisLine={false}
                width={36}
                label={{
                  value: 'Students',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 8,
                  style: { fontSize: 11, fill: 'var(--ps-text-muted, #94a3b8)' },
                }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  background: 'var(--ps-surface, #1e293b)',
                  border: '1px solid var(--ps-border, #334155)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--ps-text, #f1f5f9)',
                }}
                formatter={(value) => [value, 'Affected Students']}
              />
              <Bar dataKey="affectedStudents" radius={[4, 4, 0, 0]}>
                {skillGapDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-skill-${index}`}
                    fill={PRIORITY_COLOR[entry.priority] ?? ACCENT_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Priority legend */}
          <div className="flex gap-4 text-xs text-text-muted pt-1">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#ef4444' }} />
              High priority
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#f59e0b' }} />
              Medium priority
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#6366f1' }} />
              Low priority
            </span>
          </div>
        </GlassCard>

        {/* ── Department Readiness BarChart (horizontal) ───────────── */}
        <GlassCard variant="surface" padding="md" className="space-y-4">
          <div>
            <h2 className="text-title font-bold text-text">Department Cohort Readiness</h2>
            <p className="text-caption text-text-muted">
              Benchmark placement readiness index by engineering discipline.
            </p>
          </div>

          <ResponsiveContainer
            width="100%"
            height={260}
            aria-label="Horizontal bar chart showing placement readiness percentage by department"
          >
            <BarChart
              layout="vertical"
              data={departmentReadiness}
              margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: 'var(--ps-text-muted, #94a3b8)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="dept"
                tick={{ fontSize: 12, fill: 'var(--ps-text, #f1f5f9)', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  background: 'var(--ps-surface, #1e293b)',
                  border: '1px solid var(--ps-border, #334155)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--ps-text, #f1f5f9)',
                }}
                formatter={(value, _name, props) => {
                  const entry = props.payload as typeof departmentReadiness[number];
                  return [
                    `${value}% — ${entry.students} enrolled, ${entry.eligible} eligible`,
                    entry.fullName,
                  ];
                }}
              />
              <Bar dataKey="readiness" fill={ACCENT_COLOR} radius={[0, 4, 4, 0]} label={{ position: 'right', formatter: (v: unknown) => `${v}%`, fontSize: 12, fill: 'var(--ps-text-muted, #94a3b8)' }} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

      </div>
    </div>
  );
}
