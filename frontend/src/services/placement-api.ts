/**
 * PeerSphere — Placement API Service
 * Dedicated service for fetching placement officer-related data
 * Provides clean, typed functions for the frontend to consume
 */

import { apiClient, getErrorMessage } from '@/lib/api-client';
import {
  BackendJob,
  BackendJobList,
  BackendStudent,
  BackendStudentList,
  BackendApplication,
  BackendApplicationList,
  BackendEvaluation,
  BackendEvaluationList,
  BackendPlacementStats,
  BackendSkillGap,
  BackendSkillGaps,
  mapBackendJobToFrontend,
  mapBackendStudentToFrontend,
  mapBackendApplicationToFrontend,
  JobQueryParams,
  ListQueryParams,
} from '@/types/api';
import type { Job, Student, Application, Candidate, PlacementStat, SkillGapDistribution } from '@/types';

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
export async function fetchJobById(id: string): Promise<BackendJob> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendJob }>(`/jobs/${id}`);
    return response.data.data;
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
 */
export async function fetchCandidatesForJob(jobId: string): Promise<Candidate[]> {
  try {
    const [applications, evaluations] = await Promise.all([
      fetchApplicationsByJobId(jobId, { pageSize: 50 }),
      fetchEvaluationsByJobId(jobId, { pageSize: 50 }),
    ]);

    const candidates: Candidate[] = [];

    for (const app of applications.items) {
      const evalData = evaluations.items.find((e) => e.studentId === app.studentId);
      
      const candidate: Candidate = {
        student: mapBackendStudentToFrontend({
          id: app.studentId,
          userId: app.studentId,
          name: `Student ${app.studentId.slice(-4)}`,
          rollNumber: app.studentId,
          department: 'Computer Science',
          program: 'B.Tech',
          year: 4,
          cgpa: 8.0,
          activeBacklogs: 0,
          totalBacklogs: 0,
          profileCompleteness: 90,
          placementReadiness: 85,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        application: mapBackendApplicationToFrontend(app),
        matchResult: evalData
          ? {
              jobId: evalData.jobVersion?.jobId || jobId,
              studentId: evalData.studentId,
              overallScore: evalData.overallScore || 0,
              confidenceScore: evalData.confidenceScore || 0,
              eligibilityStatus: evalData.eligibility as any,
              coveragePercent: evalData.coveragePercent || 0,
              strongSkills: [],
              partialSkills: [],
              missingSkills: [],
              matchSummary: evalData.matchSummary || '',
              analysisVersion: '2.1.0',
              generatedAt: evalData.createdAt,
              requiresHumanReview: evalData.requiresReview,
            }
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
            },
        rank: 0,
        isShortlisted: app.status === 'shortlisted',
        shortlistedAt: app.status === 'shortlisted' ? app.updatedAt : undefined,
      };

      candidates.push(candidate);
    }

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
