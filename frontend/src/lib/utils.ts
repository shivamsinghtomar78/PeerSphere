import { type ClassValue, clsx } from 'clsx';

/**
 * Merge class names conditionally (like cn() from shadcn).
 * Uses clsx for conditional logic.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a percentage score for display.
 * Returns e.g. "82%" or "—" for null/undefined.
 */
export function formatScore(score: number | null | undefined): string {
  if (score == null) return '—';
  return `${Math.round(score)}%`;
}

/**
 * Format a CGPA value.
 */
export function formatCgpa(cgpa: number): string {
  return cgpa.toFixed(2);
}

/**
 * Convert an ISO date string to a short human-readable date.
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Return relative time label (e.g. "3 days ago").
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

/**
 * Map a match score (0–100) to its semantic color token class.
 * Always pair with a text label — do NOT rely on color alone.
 */
export function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-match-strong';
  if (score >= 60) return 'text-match-partial';
  return 'text-match-missing';
}

/**
 * Map a match score to a badge variant name.
 */
export function scoreBadgeVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
}

/**
 * Map confidence (0–100) to label text.
 */
export function confidenceLabel(score: number): string {
  if (score >= 90) return 'Very High';
  if (score >= 75) return 'High';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Low';
  return 'Very Low';
}

/**
 * Map eligibility status to a display label.
 */
export function eligibilityLabel(status: string): string {
  const labels: Record<string, string> = {
    eligible: 'Eligible',
    ineligible: 'Not Eligible',
    conditional: 'Conditional',
    pending: 'Pending Check',
  };
  return labels[status] ?? status;
}

/**
 * Map application status to display label.
 */
export function applicationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    applied: 'Applied',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    interview_scheduled: 'Interview Scheduled',
    offer_extended: 'Offer Extended',
    offer_accepted: 'Offer Accepted',
    rejected: 'Not Selected',
    withdrawn: 'Withdrawn',
  };
  return labels[status] ?? status;
}

/**
 * Clamp a number to [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Interpolate skill status symbol (for non-color-only status).
 */
export function skillStatusSymbol(status: string): string {
  const symbols: Record<string, string> = {
    strong: '✓',
    partial: '⚠',
    missing: '✕',
  };
  return symbols[status] ?? '·';
}

/**
 * Pluralise a word.
 */
export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
