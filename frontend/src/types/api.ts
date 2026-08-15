/**
 * PeerSphere — API Response Types
 * Types that match the backend API responses
 */

import type { Skill, MatchResult, SkillGap, Recommendation, Application, Job, Student } from './index';

// ─── Backend Response Wrappers ────────────────────────────────────────

/** Standard success response from backend */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  requestId?: string;
}

/** Error response from backend */
export interface ApiError {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────

/** User data returned from login */
export interface AuthUser {
  id: string;
  email: string;
  role: 'STUDENT' | 'PLACEMENT_ADMIN';
}

/** Login response */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/** Refresh token response */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── Student Profile ──────────────────────────────────────────────────

/** Student profile from backend (GET /api/v1/students/me) */
export interface BackendStudent {
  id: string;
  userId: string;
  name: string;
  rollNumber: string;
  department: string;
  program: string;
  year: number;
  cgpa: number | null;
  activeBacklogs: number;
  totalBacklogs: number;
  profileCompleteness: number;
  placementReadiness: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    role: string;
  };
  skillEvidence?: Array<{
    id: string;
    skill: {
      id: string;
      canonicalName: string;
      category: string;
    };
    confidence: number;
    source: string;
  }>;
  resumeVersions?: Array<{
    id: string;
    storageKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    state: string;
    createdAt: string;
  }>;
}

/** Student list response */
export interface BackendStudentList {
  items: BackendStudent[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

/** Skill evidence from backend */
export interface BackendSkillEvidence {
  id: string;
  studentId: string;
  skillId: string;
  confidence: number;
  source: string;
  evidenceText?: string;
  proficiency?: number;
  createdAt: string;
  updatedAt: string;
  skill: {
    id: string;
    canonicalName: string;
    category: string;
    aliases: string[];
  };
}

/** Resume version from backend */
export interface BackendResumeVersion {
  id: string;
  studentId: string;
  storageKey: string;
  originalName: string;
  checksum: string;
  mimeType: string;
  sizeBytes: number;
  state: string;
  parserVersion?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// ─── Jobs ─────────────────────────────────────────────────────────────

/** Job from backend (GET /api/v1/jobs) */
export interface BackendJob {
  jobId: string;
  status: string;
  jobVersionId: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  jobType: string;
  salary?: string;
  deadline: string;
  applicationCount: number;
  shortlistedCount: number;
  minCgpa?: number;
  maxBacklogs: number;
  allowedDepartments: string[];
  allowedPrograms: string[];
  requirements: Array<{
    id: string;
    type: string;
    required: boolean;
    weight: number;
    label: string;
    skillName?: string;
  }>;
}

/** Job detail from backend (GET /api/v1/jobs/:id) */
export interface BackendJobDetail {
  jobId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: {
    jobVersionId: string;
    versionNumber: number;
    title: string;
    company: string;
    location: string;
    workMode: string;
    jobType: string;
    salary?: string;
    description: string;
    deadline: string;
    minCgpa?: number;
    maxBacklogs: number;
    allowedDepartments: string[];
    allowedPrograms: string[];
    applicationCount: number;
    shortlistedCount: number;
    publishedAt?: string;
    createdAt: string;
    requirements: Array<{
      id: string;
      type: string;
      required: boolean;
      weight: number;
      label: string;
      skill: {
        id: string;
        canonicalName: string;
        category: string;
        aliases: string[];
      } | null;
    }>;
  };
}

/** Paginated jobs response */
export interface BackendJobList {
  items: BackendJob[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// ─── Applications ──────────────────────────────────────────────────────

/** Application from backend */
export interface BackendApplication {
  id: string;
  studentId: string;
  jobId: string;
  status: string;
  notes?: string;
  appliedAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
    company: string;
    deadline?: string;
  };
  latestEvaluation?: {
    id: string;
    eligibility: string;
    status: string;
    overallScore?: number;
    confidenceScore?: number;
    coveragePercent?: number;
  } | null;
}

/** Application list response */
export interface BackendApplicationList {
  items: BackendApplication[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// ─── Evaluations ───────────────────────────────────────────────────────

/** Evaluation from backend */
export interface BackendEvaluation {
  id: string;
  studentId: string;
  jobVersionId: string;
  inputSnapshot: any;
  snapshotHash: string;
  eligibility: string;
  status: string;
  overallScore?: number;
  confidenceScore?: number;
  coveragePercent?: number;
  matchSummary?: string;
  algorithmVersion: string;
  requiresReview: boolean;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
  requirementMatches?: Array<{
    id: string;
    requirementId: string;
    skillId?: string;
    matchState: string;
    contribution: number;
    explanation: string;
  }>;
  recommendations?: Array<{
    id: string;
    skillName: string;
    priority: string;
    reason: string;
    steps: string[];
    potentialLift?: number;
    estimatedWeeks?: number;
  }>;
  student?: {
    id: string;
    name: string;
    rollNumber: string;
  };
  jobVersion?: {
    id: string;
    title: string;
    company: string;
    version: number;
    jobId: string;
  };
}

/** Evaluation list response */
export interface BackendEvaluationList {
  items: BackendEvaluation[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// ─── Match Results ────────────────────────────────────────────────────

/** Match detail from backend */
export interface BackendRequirementMatch {
  id: string;
  requirementId: string;
  skillId?: string;
  matchState: string;
  contribution: number;
  explanation: string;
  skill?: {
    id: string;
    canonicalName: string;
    category: string;
  };
  requirement?: {
    id: string;
    type: string;
    required: boolean;
    weight: number;
    label: string;
  };
}

// ─── Analytics ────────────────────────────────────────────────────────

/** Placement stats from backend */
export interface BackendPlacementStats {
  totalStudents: number;
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
  offersExtended: number;
  offersAccepted: number;
  avgMatchScore?: number;
  avgConfidence?: number;
  placementRate: number;
}

/** Skill gap from backend */
export interface BackendSkillGap {
  skillId: string;
  skillName: string;
  count: number;
  priority: string;
}

/** Skill gaps response */
export interface BackendSkillGaps {
  totalStudents: number;
  skillGaps: BackendSkillGap[];
}

// ─── Query Parameters ──────────────────────────────────────────────────

/** Query params for list endpoints */
export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  department?: string;
  [key: string]: string | number | undefined;
}

/** Query params for job list */
export interface JobQueryParams extends ListQueryParams {
  search?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  department?: string;
}

/** Query params for application list */
export interface ApplicationQueryParams extends ListQueryParams {
  status?: string;
}

// ─── Request Bodies ───────────────────────────────────────────────────

/** Login request body */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Refresh token request body */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** Update student profile request body */
export interface UpdateStudentRequest {
  name?: string;
  // Other fields are managed by admin
}

/** Add skill request body */
export interface AddSkillRequest {
  skillName: string;
}

// ─── Type Mapping Utilities ────────────────────────────────────────────

/** Map backend student to frontend Student type */
export const mapBackendStudentToFrontend = (backendStudent: BackendStudent): Student => ({
  id: backendStudent.id,
  name: backendStudent.name,
  email: backendStudent.user?.email || backendStudent.userId,
  rollNumber: backendStudent.rollNumber,
  department: backendStudent.department,
  program: backendStudent.program,
  year: backendStudent.year,
  cgpa: backendStudent.cgpa || 0,
  activeBacklogs: backendStudent.activeBacklogs,
  totalBacklogs: backendStudent.totalBacklogs,
  profileCompleteness: backendStudent.profileCompleteness,
  placementReadiness: backendStudent.placementReadiness,
  skills: backendStudent.skillEvidence?.map((se) => ({
    id: se.skill.id,
    name: se.skill.canonicalName,
    category: se.skill.category,
    confidence: se.confidence,
  })) || [],
  resumeUrl: backendStudent.resumeVersions?.[0]?.storageKey,
  resumeUpdatedAt: backendStudent.resumeVersions?.[0]?.createdAt,
});

/** Map backend job to frontend Job type */
export const mapBackendJobToFrontend = (backendJob: BackendJob): Job => ({
  id: backendJob.jobId,
  title: backendJob.title,
  company: backendJob.company,
  location: backendJob.location,
  workMode: backendJob.workMode.toLowerCase() as WorkMode,
  jobType: backendJob.jobType.toLowerCase().replace('_', '-') as JobType,
  status: backendJob.status.toLowerCase() as JobStatus,
  salary: backendJob.salary,
  eligibility: {
    minCgpa: backendJob.minCgpa || 0,
    allowedDepartments: backendJob.allowedDepartments,
    allowedPrograms: backendJob.allowedPrograms,
    maxBacklogs: backendJob.maxBacklogs,
  },
  requiredSkills: backendJob.requirements
    .filter((r) => r.required)
    .map((r) => ({
      id: r.id,
      name: r.skillName || r.label,
      category: 'Unknown',
    })),
  preferredSkills: backendJob.requirements
    .filter((r) => !r.required)
    .map((r) => ({
      id: r.id,
      name: r.skillName || r.label,
      category: 'Unknown',
    })),
  responsibilities: [],
  description: '',
  postedAt: '',
  deadline: backendJob.deadline,
  applicationCount: backendJob.applicationCount,
  shortlistedCount: backendJob.shortlistedCount,
});

/** Map backend application to frontend Application type */
export const mapBackendApplicationToFrontend = (
  backendApp: BackendApplication
): Application => ({
  id: backendApp.id,
  studentId: backendApp.studentId,
  jobId: backendApp.jobId,
  status: backendApp.status.toLowerCase().replace('_', '-') as ApplicationStatus,
  appliedAt: backendApp.appliedAt,
  updatedAt: backendApp.updatedAt,
  notes: backendApp.notes,
  matchResult: backendApp.latestEvaluation ? {
    jobId: backendApp.jobId,
    studentId: backendApp.studentId,
    overallScore: backendApp.latestEvaluation.overallScore || 0,
    confidenceScore: backendApp.latestEvaluation.confidenceScore || 0,
    eligibilityStatus: backendApp.latestEvaluation.eligibility as EligibilityStatus,
    coveragePercent: backendApp.latestEvaluation.coveragePercent || 0,
    strongSkills: [],
    partialSkills: [],
    missingSkills: [],
    matchSummary: backendApp.latestEvaluation.matchSummary || '',
    analysisVersion: '2.1.0',
    generatedAt: backendApp.latestEvaluation.createdAt,
    requiresHumanReview: backendApp.latestEvaluation.requiresReview,
  } : undefined,
});
