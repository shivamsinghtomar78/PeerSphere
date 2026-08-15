'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { SkillChip } from '@/components/product/SkillChip';
import { useToast } from '@/components/ui/Toast';
import { currentStudent } from '@/data/students';
import { formatDate } from '@/lib/utils';

export default function StudentProfilePage() {
  const [student, setStudent] = useState(currentStudent);
  const [newSkill, setNewSkill] = useState('');
  const { toast } = useToast();

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    const skillObj = {
      id: `sk-${Date.now()}`,
      name: newSkill.trim(),
      category: 'Student Added',
    };

    setStudent({
      ...student,
      skills: [...student.skills, skillObj],
    });
    setNewSkill('');
  };

  const handleRemoveSkill = (id: string) => {
    setStudent({
      ...student,
      skills: student.skills.filter((s) => s.id !== id),
    });
  };

  const handleSave = () => {
    toast('Profile saved successfully', 'success');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Profile & Resume Management
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Keep your verified academic record, parsed skills, and resume updated for automated AI placement screening.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          onClick={handleSave}
        >
          Save Changes
        </GlassButton>
      </div>

      {/* Academic Credentials Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard variant="surface" padding="md" className="space-y-4 md:col-span-2">
          <h2 className="text-title font-bold text-text">Academic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Full Name"
              value={student.name}
              onChange={(e) => setStudent({ ...student, name: e.target.value })}
            />
            <GlassInput
              label="University Email"
              value={student.email}
              disabled
              hint="Verified college identity"
            />
            <GlassInput
              label="Roll Number / Student ID"
              value={student.rollNumber}
              disabled
            />
            <GlassInput
              label="Department / Branch"
              value={student.department}
              disabled
            />
            <GlassInput
              label="Current CGPA"
              value={student.cgpa.toString()}
              disabled
              hint="Verified by Placement Cell"
            />
            <GlassInput
              label="Active Backlogs"
              value={student.activeBacklogs.toString()}
              disabled
            />
          </div>
        </GlassCard>

        {/* Resume Box */}
        <GlassCard variant="surface" padding="md" className="space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-title font-bold text-text">Active Resume</h2>
            <p className="text-xs text-text-muted mt-1">
              Parsed for AI match modeling.
            </p>

            <div className="mt-4 p-4 rounded-lg bg-canvas-subtle border border-border-subtle text-center space-y-2">
              <div className="text-text-muted">
                <svg className="w-8 h-8 mx-auto text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-text">resume-arjun-v2.pdf</p>
              <p className="text-xs text-text-faint">
                Updated: {student.resumeUpdatedAt ? formatDate(student.resumeUpdatedAt) : 'Recently'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <GlassButton variant="secondary" size="sm" fullWidth>
              Upload New PDF
            </GlassButton>
            <span className="text-caption text-text-faint text-center block">
              Max file size 5MB • PDF only
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Verified Skills Management */}
      <GlassCard variant="surface" padding="md" className="space-y-4">
        <div>
          <h2 className="text-title font-bold text-text">Skills & Competencies</h2>
          <p className="text-xs text-text-muted mt-1">
            Add technical skills verified in your projects, internships, or certifications.
          </p>
        </div>

        {/* Add skill form at the top so it's never occluded by bottom nav */}
        <form
          onSubmit={handleAddSkill}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Add skill (e.g. Docker)..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="h-9 flex-1 px-3 text-sm rounded-sm border border-border bg-surface text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]"
          />
          <GlassButton
            variant="secondary"
            size="sm"
            type="submit"
            style={{ scrollMarginBottom: 'calc(var(--ps-bottom-nav-height, 64px) + 16px)' }}
          >
            + Add
          </GlassButton>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {student.skills.map((skill) => (
            <div key={skill.id} className="relative group">
              <SkillChip skill={skill} size="md" />
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill.id)}
                aria-label={`Remove skill ${skill.name}`}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger text-text-inverse text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
