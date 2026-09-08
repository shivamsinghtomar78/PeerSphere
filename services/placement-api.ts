/**
 * PeerSphere — Placement API Service
 * Dedicated service for fetching placement officer-related data
 * Provides clean, typed functions for the frontend to consume
 */

import { apiClient, getErrorMessage } from '@/lib/api-client';
import {
  BackendJob,
  BackendJobDetail,
  BackendJobList,
  BackendStudent,
  BackendStudentList,
  BackendApplication,
  BackendApplicationList,
  BackendEvaluation,
  BackendEvaluationList,
  BackendPlacementStats,
  BackendSkillGaps,
  mapBackendJobToFrontend,
  mapBackendJobDetailToFrontend,
  mapBackendStudentToFrontend,
  mapBackendApplicationToFrontend,
  mapBackendEvaluationToMatchResult,
  JobQueryParams,
  ListQueryParams,
} from '@/types/api';
import type {
  Job,
  Student,
  Application,
  Candidate,
  MatchResult,
  PlacementStat,
  SkillGapDistribution,
} from '@/types';

// ─── Jobs ─────────────────────────────────────────────────────────────

/**
 * Fetch all jobs (PLACEMENT_ADMIN only)
 * GET /api/v1/jobs
 */
export async function fetchAllJobs(params?: JobQueryParams): Promise<BackendJobList> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendJobList }>('/jobs', {
      params,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Fetch a single job by ID
 * GET /api/v1/jobs/:id
 */
export async function fetchJobById(id: string): Promise<BackendJobDetail> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendJobDetail }>(`/jobs/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/** Converter for the nested GET /jobs/[id] detail shape (fields under `version`). */
export function convertToFrontendJobDetail(backendJob: BackendJobDetail): Job {
  return mapBackendJobDetailToFrontend(backendJob);
}

// ─── Overrides ───────────────────────────────────────────────────────

export interface EvaluationOverride {
  id: string;
  decision: 'shortlist' | 'reject' | 'review' | 'promote';
  reason: string;
  createdAt: string;
  actor?: { id: string; email: string; role: string };
}

/**
 * Record an admin override on an evaluation (append-only, reason required)
 * POST /api/v1/evaluations/[evaluationId]/override
 */
export async function createOverride(
  evaluationId: string,
  decision: EvaluationOverride['decision'],
  reason: string
): Promise<EvaluationOverride> {
  try {
    const response = await apiClient.post<{ success: boolean; data: EvaluationOverride }>(
      `/evaluations/${evaluationId}/override`,
      { decision, reason }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * List the override history for an evaluation
 * GET /api/v1/evaluations/[evaluationId]/overrides
 */
export async function fetchEvaluationOverrides(evaluationId: string): Promise<EvaluationOverride[]> {
  try {
    const response = await apiClient.get<{
      success: boolean;
      data: { overrides: EvaluationOverride[] };
    }>(`/evaluations/${evaluationId}/overrides`);
    return response.data.data.overrides ?? [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Create a new job
 * POST /api/v1/jobs
 */
export async function createJob(data: any): Promise<BackendJob> {
  try {
    const response = await apiClient.post<{ success: boolean; data: BackendJob }>('/jobs', data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update a job
 * PATCH /api/v1/jobs/:id
 */
export async function updateJob(id: string, data: any): Promise<BackendJob> {
  try {
    const response = await apiClient.patch<{ success: boolean; data: BackendJob }>(`/jobs/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Publish a job
 * POST /api/v1/jobs/:id/publish
 */
export async function publishJob(id: string): Promise<BackendJob> {
  try {
    const response = await apiClient.post<{ success: boolean; data: BackendJob }>(`/jobs/${id}/publish`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Close a job
 * POST /api/v1/jobs/:id/close
 */
export async function closeJob(id: string): Promise<BackendJob> {
  try {
    const response = await apiClient.post<{ success: boolean; data: BackendJob }>(`/jobs/${id}/close`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Students ──────────────────────────────────────────────────────────

/**
 * Fetch all students (PLACEMENT_ADMIN only)
 * GET /api/v1/students
 */
export async function fetchAllStudents(params?: ListQueryParams): Promise<BackendStudentList> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendStudentList }>('/students', {
      params,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Fetch a single student by ID
 * GET /api/v1/students/:id
 */
export async function fetchStudentById(id: string): Promise<BackendStudent> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendStudent }>(`/students/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Applications ──────────────────────────────────────────────────────

/**
 * Fetch applications for a specific job (PLACEMENT_ADMIN only)
 * GET /api/v1/jobs/:id/applications
 */
export async function fetchApplicationsByJobId(jobId: string, params?: ListQueryParams): Promise<BackendApplicationList> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendApplicationList }>(`/jobs/${jobId}/applications`, {
      params,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Fetch all applications (PLACEMENT_ADMIN only)
 * GET /api/v1/applications
 */
export async function fetchAllApplications(params?: ListQueryParams): Promise<BackendApplicationList> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendApplicationList }>('/applications', {
      params,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update application status (PLACEMENT_ADMIN only)
 * PATCH /api/v1/applications/:id
 */
export async function updateApplicationStatus(id: string, status: string): Promise<BackendApplication> {
  try {
    const response = await apiClient.patch<{ success: boolean; data: BackendApplication }>(`/applications/${id}`, {
      status,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Evaluations ───────────────────────────────────────────────────────

/**
 * Fetch evaluations for a specific job (PLACEMENT_ADMIN only)
 * GET /api/v1/jobs/:id/evaluations
 */
export async function fetchEvaluationsByJobId(jobId: string, params?: ListQueryParams): Promise<BackendEvaluationList> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendEvaluationList }>(`/jobs/${jobId}/evaluations`, {
      params,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Fetch a single evaluation by ID
 * GET /api/v1/evaluations/:id
 */
export async function fetchEvaluationById(id: string): Promise<BackendEvaluation> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendEvaluation }>(`/evaluations/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Queue an evaluation
 * POST /api/v1/evaluations/queue
 */
export async function queueEvaluation(studentId: string, jobId: string): Promise<BackendEvaluation> {
  try {
    const response = await apiClient.post<{ success: boolean; data: BackendEvaluation }>('/evaluations/queue', {
      studentId,
      jobId,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Analytics ────────────────────────────────────────────────────────

/**
 * Fetch placement statistics (PLACEMENT_ADMIN only)
 * GET /api/v1/analytics/placement-stats
 */
export async function fetchPlacementStats(): Promise<BackendPlacementStats> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendPlacementStats }>('/analytics/placement-stats');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Fetch skill gaps analysis (PLACEMENT_ADMIN only)
 * GET /api/v1/analytics/skill-gaps
 */
export async function fetchSkillGapsAnalysis(): Promise<BackendSkillGaps> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendSkillGaps }>('/analytics/skill-gaps');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Reports ───────────────────────────────────────────────────────────

/**
 * Fetch available reports (PLACEMENT_ADMIN only)
 * GET /api/v1/reports
 */
export async function fetchReports(params?: ListQueryParams) {
  try {
    const response = await apiClient.get('/reports', { params });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Dashboard Data Fetching ──────────────────────────────────────────

/**
 * Fetch all data needed for the placement dashboard in parallel
 */
export async function fetchPlacementDashboardData() {
  try {
    const [stats, jobs, students, applications, skillGaps] = await Promise.all([
      fetchPlacementStats(),
      fetchAllJobs({ pageSize: 10, status: 'PUBLISHED' }),
      fetchAllStudents({ pageSize: 20 }),
      fetchAllApplications({ pageSize: 20 }),
      fetchSkillGapsAnalysis(),
    ]);

    return {
      stats,
      jobs,
      students,
      applications,
      skillGaps,
    };
  } catch (error) {
    return {
      stats: null,
      jobs: null,
      students: null,
      applications: null,
      skillGaps: null,
      error: getErrorMessage(error),
    };
  }
}

// ─── Helper Functions ────────────────────────────────────────────────

/**
 * Get candidates for a specific job
 * Composes real data from the job's applications + evaluations (client-side)
 */
export async function fetchCandidatesForJob(jobId: string): Promise<Candidate[]> {
  try {
    const [applications, evaluations] = await Promise.all([
      fetchApplicationsByJobId(jobId, { pageSize: 100 }),
      fetchEvaluationsByJobId(jobId, { pageSize: 100 }),
    ]);

    const evalByStudentId = new Map(
      evaluations.items.map((e) => [e.studentId, e])
    );

    const candidates: Candidate[] = applications.items
      .filter((app) => app.student)
      .map((app) => {
        const studentData = app.student as any;
        const evalData =
          evalByStudentId.get(app.studentId) ?? (app.latestEvaluation as any) ?? null;

        const student: Student = {
          id: app.studentId,
          name: studentData.name || 'Unknown Student',
          email: studentData.email || '',
          rollNumber: studentData.rollNumber || app.studentId,
          department: studentData.department || 'Unknown',
          program: studentData.program || 'B.Tech',
          year: studentData.year ?? 4,
          cgpa: studentData.cgpa != null ? Number(studentData.cgpa) : 0,
          activeBacklogs: studentData.activeBacklogs ?? 0,
          totalBacklogs: studentData.totalBacklogs ?? 0,
          skills: studentData.skillEvidence?.map((se: any) => ({
            id: se.skill?.id ?? se.skillId,
            name: se.skill?.canonicalName ?? 'Unknown',
            category: se.skill?.category ?? 'Unknown',
            confidence: se.confidence,
          })) ?? [],
          profileCompleteness: studentData.profileCompleteness ?? 0,
          placementReadiness: studentData.placementReadiness ?? 0,
        };

        const matchResult: MatchResult = evalData
          ? mapBackendEvaluationToMatchResult(evalData, jobId)
          : {
              jobId,
              studentId: app.studentId,
              overallScore: 0,
              confidenceScore: 0,
              eligibilityStatus: 'pending',
              coveragePercent: 0,
              strongSkills: [],
              partialSkills: [],
              missingSkills: [],
              matchSummary: '',
              analysisVersion: '2.1.0',
              generatedAt: new Date().toISOString(),
              requiresHumanReview: false,
            };

        return {
          student,
          application: mapBackendApplicationToFrontend(app),
          matchResult,
          rank: 0,
          isShortlisted: app.status === 'SHORTLISTED',
          shortlistedAt: app.status === 'SHORTLISTED' ? app.updatedAt : undefined,
        };
      });

    return candidates;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Convert backend job to frontend Job type
 */
export function convertToFrontendJob(backendJob: BackendJob): Job {
  return mapBackendJobToFrontend(backendJob);
}

/**
 * Convert backend student to frontend Student type
 */
export function convertToFrontendStudent(backendStudent: BackendStudent): Student {
  return mapBackendStudentToFrontend(backendStudent);
}

/**
 * Convert backend application to frontend Application type
 */
export function convertToFrontendApplication(backendApp: BackendApplication): Application {
  return mapBackendApplicationToFrontend(backendApp);
}

/**
 * Get top candidates (shortlisted or highest score)
 */
export function getTopCandidates(candidates: Candidate[], limit = 10): Candidate[] {
  return [...candidates]
    .sort((a, b) => {
      // Shortlisted first
      if (a.isShortlisted && !b.isShortlisted) return -1;
      if (!a.isShortlisted && b.isShortlisted) return 1;
      // Then by score (descending)
      return (b.matchResult?.overallScore || 0) - (a.matchResult?.overallScore || 0);
    })
    .slice(0, limit);
}

/**
 * Map backend skill gaps to frontend format
 */
export function mapBackendSkillGapsToFrontend(backendSkillGaps: BackendSkillGaps): SkillGapDistribution[] {
  if (!backendSkillGaps.skillGaps) return [];
  
  return backendSkillGaps.skillGaps.map((gap) => ({
    skill: gap.skillName,
    affectedStudents: gap.count,
    priority: gap.priority as 'high' | 'medium' | 'low',
  }));
}

/**
 * Map backend placement stats to frontend format
 */
export function mapBackendPlacementStatsToFrontend(stats: BackendPlacementStats): PlacementStat[] {
  return [
    { label: 'Total Students', value: stats.totalStudents, delta: 0, unit: 'students' },
    { label: 'Active Jobs', value: stats.activeJobs, delta: 0, unit: 'jobs' },
    { label: 'Total Applications', value: stats.totalApplications, delta: 0, unit: 'applications' },
    { label: 'Shortlisted', value: stats.shortlisted, delta: 0, unit: 'candidates' },
    { label: 'Offers Extended', value: stats.offersExtended, delta: 0, unit: 'offers' },
    { label: 'Offers Accepted', value: stats.offersAccepted, delta: 0, unit: 'offers' },
    { label: 'Placement Rate', value: `${stats.placementRate}%`, delta: 0, unit: 'percent' },
  ];
}
