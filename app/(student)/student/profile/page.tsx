'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ClayButton } from '@/components/ui/ClayButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { SkillChip } from '@/components/product/SkillChip';
import { useToast } from '@/components/ui/Toast';
import { LoadingState, EmptyState, ErrorState } from '@/components/states';
import {
  fetchMyProfile,
  addMySkill,
  removeMySkill,
  updateMyProfile,
  uploadResume,
  fetchMyResumes,
  downloadMyResume,
  convertToFrontendStudent,
} from '@/services/student-api';
import type { Student, Skill } from '@/types';
import { formatDate } from '@/lib/utils';

interface ResumeVersionRow {
  id: string;
  originalName: string;
  sizeBytes: number;
  state: string;
  createdAt: string;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '—';
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function resumeStateBadge(state: string): { label: string; variant: 'success' | 'warning' | 'danger' | 'muted' } {
  const s = String(state || '').toUpperCase();
  if (s === 'PARSED') return { label: 'Parsed', variant: 'success' };
  if (s === 'UPLOADED' || s === 'PARSING') return { label: 'Processing', variant: 'warning' };
  if (s === 'FAILED') return { label: 'Parse failed', variant: 'danger' };
  return { label: state || 'On file', variant: 'muted' };
}

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [resumes, setResumes] = useState<ResumeVersionRow[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const reloadProfile = async () => {
    const backendStudent = await fetchMyProfile();
    setStudent(convertToFrontendStudent(backendStudent));
    // Version history is non-critical: the profile still renders if it fails
    try {
      setResumes(await fetchMyResumes());
    } catch {
      setResumes([]);
    }
  };

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await reloadProfile();
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleDownloadResume = async (resumeId: string, filename: string) => {
    try {
      await downloadMyResume(resumeId, filename);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to download resume', 'error');
    }
  };

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast('Only PDF files are allowed', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Max file size is 5MB', 'error');
      return;
    }

    try {
      setIsUploading(true);
      await uploadResume(file);
      await reloadProfile();
      toast('Resume uploaded successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload resume';
      toast(message, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || !student) return;

    try {
      const newSkillData = await addMySkill(newSkill.trim());
      
      // Add the new skill to local state
      const skillObj: Skill = {
        id: newSkillData.skillId || `sk-${Date.now()}`,
        name: newSkillData.skill?.canonicalName || newSkill.trim(),
        category: newSkillData.skill?.category || 'Student Added',
        confidence: newSkillData.confidence || 0,
      };

      setStudent({
        ...student,
        skills: [...student.skills, skillObj],
      });
      setNewSkill('');
      toast('Skill added successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add skill';
      toast(message, 'error');
    }
  };

  const handleRemoveSkill = async (id: string) => {
    if (!student) return;

    try {
      await removeMySkill(id);
      setStudent({
        ...student,
        skills: student.skills.filter((s) => s.id !== id),
      });
      toast('Skill removed successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove skill';
      toast(message, 'error');
    }
  };

  const handleSave = async () => {
    if (!student) return;

    try {
      await updateMyProfile({ name: student.name });
      toast('Profile saved successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      toast(message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <LoadingState label="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <ErrorState title="Failed to load profile" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <EmptyState
          title="No profile found"
          description="Your student profile could not be loaded. Please try again later."
        />
      </div>
    );
  }

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

        <ClayButton
          size="md"
          onClick={handleSave}
        >
          Save Changes
        </ClayButton>
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
              value={student.cgpa ? student.cgpa.toString() : 'N/A'}
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
              <p className="text-sm font-semibold text-text">{student.resumeName || 'No resume uploaded'}</p>
              <p className="text-xs text-text-faint">
                Updated: {student.resumeUpdatedAt ? formatDate(student.resumeUpdatedAt) : 'Never'}
              </p>
              {resumes.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleDownloadResume(resumes[0].id, resumes[0].originalName)}
                  className="inline-block text-xs text-accent hover:underline cursor-pointer"
                >
                  Download resume
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleUploadResume}
              aria-label="Upload resume PDF"
            />
            <GlassButton
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading…' : 'Upload New PDF'}
            </GlassButton>
            <span className="text-caption text-text-faint text-center block">
              Max file size 5MB • PDF only
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Resume Version History */}
      <GlassCard variant="surface" padding="md" className="space-y-1">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-title font-bold text-text">Resume version history</h2>
            <p className="text-xs text-text-muted mt-1">
              Each upload becomes a new version and is re-parsed; older versions stay on file.
            </p>
          </div>
          {resumes.length > 0 && (
            <span className="text-caption text-text-muted">
              {resumes.length} version{resumes.length === 1 ? '' : 's'} on file
            </span>
          )}
        </div>

        {resumes.length === 0 ? (
          <p className="text-sm text-text-muted pt-3 pb-1">
            No versions yet — your first upload starts the history.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {resumes.map((version, i) => {
              const badge = resumeStateBadge(version.state);
              return (
                <li key={version.id} className="flex items-center gap-3 py-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text break-all">
                        {version.originalName}
                      </span>
                      {i === 0 && <GlassBadge variant="accent">Active</GlassBadge>}
                    </div>
                    <span className="text-caption text-text-muted">
                      Uploaded {formatDate(version.createdAt)} · {formatFileSize(version.sizeBytes)}
                    </span>
                  </div>
                  <GlassBadge variant={badge.variant}>{badge.label}</GlassBadge>
                  <button
                    type="button"
                    onClick={() => handleDownloadResume(version.id, version.originalName)}
                    className="text-xs font-medium text-accent-dark hover:text-accent transition-base cursor-pointer"
                  >
                    Download
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

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
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-text-inverse text-[10px] flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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
