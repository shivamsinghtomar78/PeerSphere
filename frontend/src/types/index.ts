/**
 * PeerSphere — Core TypeScript types
 * All frontend data is typed. No `any`.
 */

// ─── Skill & Match ────────────────────────────────────────────────
export type SkillStatus = 'strong' | 'partial' | 'missing';
export type SkillPriority = 'high' | 'medium' | 'low';

export interface Skill {
  id: string;
  name: string;
  category: string;
  status?: SkillStatus;
  confidence?: number; // 0–100
}

export interface SkillGap {
  skill: Skill;
  priority: SkillPriority;
  reason: string;
  recommendation: string;
  steps?: string[];
  potentialMatchImprovement?: number; // percentage points
}

// ─── Match Result ─────────────────────────────────────────────────
export interface MatchResult {
  jobId: string;
  studentId: string;
  overallScore: number;       // 0–100
  confidenceScore: number;    // 0–100
  eligibilityStatus: EligibilityStatus;
  coveragePercent: number;    // % of required skills matched
  strongSkills: Skill[];
  partialSkills: Skill[];
  missingSkills: Skill[];
  matchSummary: string;
  evidencePath?: string;
  analysisVersion: string;
  generatedAt: string;        // ISO date string
  requiresHumanReview: boolean;
  humanReviewNote?: string;
}

export type EligibilityStatus = 'eligible' | 'ineligible' | 'conditional' | 'pending';

// ─── Student ──────────────────────────────────────────────────────
export interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  program: string;          // B.Tech, M.Tech, etc.
  year: number;
  cgpa: number;
  activeBacklogs: number;
  totalBacklogs: number;
  skills: Skill[];
  resumeUrl?: string;
  resumeUpdatedAt?: string;
  profileCompleteness: number; // 0–100
  placementReadiness: number;  // 0–100
  avatarUrl?: string;
}

export type StudentSummary = Pick<Student, 'id' | 'name' | 'rollNumber' | 'department' | 'cgpa' | 'placementReadiness'>;

// ─── Job / JD ────────────────────────────────────────────────────
export type JobStatus = 'draft' | 'published' | 'closed' | 'archived';
export type JobType = 'full-time' | 'internship' | 'contract';
export type WorkMode = 'onsite' | 'remote' | 'hybrid';

export interface EligibilityCriteria {
  minCgpa: number;
  allowedDepartments: string[];
  allowedPrograms: string[];
  maxBacklogs: number;
  otherCriteria?: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  status: JobStatus;
  salary?: string;
  eligibility: EligibilityCriteria;
  requiredSkills: Skill[];
  preferredSkills: Skill[];
  responsibilities: string[];
  description: string;
  postedAt: string;
  deadline: string;
  applicationCount?: number;
  shortlistedCount?: number;
}

export type JobSummary = Pick<Job, 'id' | 'title' | 'company' | 'location' | 'jobType' | 'workMode' | 'status' | 'postedAt' | 'deadline'>;

// ─── Application ──────────────────────────────────────────────────
export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'offer_extended'
  | 'offer_accepted'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  id: string;
  studentId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  matchResult?: MatchResult;
  notes?: string;
}

// ─── Candidate (Placement Officer view) ──────────────────────────
export interface Candidate {
  student: Student;
  application: Application;
  matchResult: MatchResult;
  rank?: number;
  isShortlisted: boolean;
  shortlistedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ─── Recommendation ───────────────────────────────────────────────
export interface Recommendation {
  id: string;
  studentId: string;
  jobId?: string;
  skill: Skill;
  priority: SkillPriority;
  steps: string[];
  currentMatchScore: number;
  projectedMatchScore: number;
  estimatedTimeWeeks?: number;
  resources?: RecommendationResource[];
}

export interface RecommendationResource {
  title: string;
  type: 'course' | 'documentation' | 'project' | 'practice';
  url?: string;
}

// ─── Analytics ────────────────────────────────────────────────────
export interface PlacementStat {
  label: string;
  value: number | string;
  delta?: number; // change from previous period
  deltaLabel?: string;
  unit?: string;
}

export interface SkillGapDistribution {
  skill: string;
  affectedStudents: number;
  priority: SkillPriority;
}

// ─── UI State ─────────────────────────────────────────────────────
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  state: LoadingState;
  error?: string;
}

// ─── Navigation ───────────────────────────────────────────────────
export type UserRole = 'student' | 'placement_admin' | 'recruiter' | 'admin';

export interface NavItem {
  label: string;
  href: string;
  icon: string;  // Lucide icon name
  badge?: number;
}

// ─── Theme ────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark' | 'system';
