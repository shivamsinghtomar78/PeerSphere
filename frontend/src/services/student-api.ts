/**
 * PeerSphere — Student API Service
 * Dedicated service for fetching student-related data
 * Provides clean, typed functions for the frontend to consume
 */

import { apiClient, getErrorMessage } from '@/lib/api-client';
import {
  BackendStudent,
  BackendJob,
  BackendJobList,
  BackendApplication,
  BackendApplicationList,
  BackendEvaluation,
  BackendEvaluationList,
  JobQueryParams,
  ApplicationQueryParams,
  mapBackendStudentToFrontend,
  mapBackendJobToFrontend,
  mapBackendApplicationToFrontend,
} from '@/types/api';
import type { Student, Job, Application, MatchResult, SkillGap, Recommendation } from '@/types';

// ─── Student Profile ──────────────────────────────────────────────────

/**
 * Fetch the current student's profile
 * GET /api/v1/students/me
 */
export async function fetchMyProfile(): Promise<BackendStudent> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendStudent }>('/students/me');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update the current student's profile
 * PATCH /api/v1/students/me
 */
export async function updateMyProfile(data: { name?: string }): Promise<BackendStudent> {
  try {
    const response = await apiClient.patch<{ success: boolean; data: BackendStudent }>(
      '/students/me',
      data
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Student Skills ───────────────────────────────────────────────────

/**
 * Fetch all skills for the current student
 * GET /api/v1/students/me/skills
 */
export async function fetchMySkills() {
  try {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/students/me/skills');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Add a skill to the current student's profile
 * POST /api/v1/students/me/skills
 */
export async function addMySkill(skillName: string) {
  try {
    const response = await apiClient.post<{ success: boolean; data: any }>('/students/me/skills', {
      skillName,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Remove a skill from the current student's profile
 * DELETE /api/v1/students/me/skills/:id
 */
export async function removeMySkill(skillId: string): Promise<void> {
  try {
    await apiClient.delete<{ success: boolean }>(`/students/me/skills/${skillId}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Resumes ────────────────────────────────────────────────────────

/**
 * Fetch all resume versions for the current student
 * GET /api/v1/students/me/resumes
 */
export async function fetchMyResumes() {
  try {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/students/me/resumes');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Upload a new resume
 * POST /api/v1/students/me/resumes
 * Note: This requires multipart/form-data, handled separately
 */
export async function uploadResume(file: File) {
  try {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await apiClient.post('/students/me/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Jobs ───────────────────────────────────────────────────────────

/**
 * Fetch all published jobs
 * GET /api/v1/jobs
 */
export async function fetchJobs(params?: JobQueryParams): Promise<BackendJobList> {
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
export async function fetchJobById(id: string) {
  try {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/jobs/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Applications ────────────────────────────────────────────────────

/**
 * Fetch all applications for the current student
 * GET /api/v1/students/me/applications
 */
export async function fetchMyApplications(
  params?: ApplicationQueryParams
): Promise<BackendApplicationList> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendApplicationList }>(
      '/students/me/applications',
      { params }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Apply to a job
 * POST /api/v1/jobs/:id/apply
 */
export async function applyToJob(jobId: string): Promise<BackendApplication> {
  try {
    const response = await apiClient.post<{ success: boolean; data: BackendApplication }>(
      `/jobs/${jobId}/apply`
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Evaluations ────────────────────────────────────────────────────

/**
 * Queue an evaluation for the current student and a job
 * POST /api/v1/evaluations/queue
 */
export async function queueEvaluation(studentId: string, jobId: string): Promise<BackendEvaluation> {
  try {
    const response = await apiClient.post<{ success: boolean; data: BackendEvaluation }>(
      '/evaluations/queue',
      { studentId, jobId }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Fetch evaluations for the current student
 * GET /api/v1/students/me/evaluations
 */
export async function fetchMyEvaluations(): Promise<BackendEvaluationList> {
  try {
    const response = await apiClient.get<{ success: boolean; data: BackendEvaluationList }>(
      '/students/me/evaluations'
    );
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
    const response = await apiClient.get<{ success: boolean; data: BackendEvaluation }>(
      `/evaluations/${id}`
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Skill Gaps ────────────────────────────────────────────────────

/**
 * Fetch skill gaps for the current student
 * This gets the top missing skills from the student's evaluations
 * GET /api/v1/analytics/skill-gaps (PLACEMENT_ADMIN only)
 * 
 * For student-specific gaps, we use evaluations endpoint
 */
export async function fetchMySkillGaps(): Promise<BackendEvaluationList> {
  // Get evaluations which contain skill gap information
  return fetchMyEvaluations();
}

// ─── Dashboard Data Fetching ──────────────────────────────────────────

/**
 * Fetch all data needed for the student dashboard in parallel
 * This is the main function used by the dashboard page
 */
export async function fetchDashboardData() {
  try {
    // Fetch all data in parallel
    const [profile, applications, evaluations, jobs] = await Promise.all([
      fetchMyProfile(),
      fetchMyApplications({ pageSize: 10 }),
      fetchMyEvaluations(),
      fetchJobs({ pageSize: 3 }), // Top 3 jobs
    ]);

    return {
      profile,
      applications,
      evaluations,
      jobs,
    };
  } catch (error) {
    // Return partial data with error
    return {
      profile: null,
      applications: null,
      evaluations: null,
      jobs: null,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get the best match result for the student
 * Finds the evaluation with the highest score
 */
export function getPrimaryMatch(evaluations: BackendEvaluation[]): BackendEvaluation | null {
  if (!evaluations || evaluations.length === 0) return null;

  // Find completed evaluations with scores
  const scoredEvals = evaluations.filter(
    (e) => e.overallScore && e.overallScore > 0 && e.status === 'COMPLETED'
  );

  if (scoredEvals.length === 0) return null;

  // Return the evaluation with the highest score
  return scoredEvals.reduce((best, current) =>
    (current.overallScore || 0) > (best.overallScore || 0) ? current : best
  );
}

/**
 * Get high priority skill gaps from evaluations
 * Extracts missing skills with high weight from evaluations
 */
export function extractSkillGapsFromEvaluations(
  evaluations: BackendEvaluation[]
): Array<{
  id: string;
  skill: { id: string; name: string; category: string };
  priority: 'high' | 'medium' | 'low';
  reason: string;
  recommendation: string;
  steps: string[];
  potentialMatchImprovement: number;
}> {
  const gaps: Array<{
    id: string;
    skill: { id: string; name: string; category: string };
    priority: 'high' | 'medium' | 'low';
    reason: string;
    recommendation: string;
    steps: string[];
    potentialMatchImprovement: number;
  }> = [];

  for (const evalData of evaluations) {
    if (evalData.recommendations && evalData.recommendations.length > 0) {
      for (const rec of evalData.recommendations) {
        gaps.push({
          id: rec.id || Math.random().toString(),
          skill: {
            id: rec.skillName.toLowerCase().replace(/\s+/g, '-'),
            name: rec.skillName,
            category: 'Unknown',
          },
          priority: rec.priority as 'high' | 'medium' | 'low',
          reason: rec.reason,
          recommendation: rec.reason,
          steps: rec.steps || [],
          potentialMatchImprovement: rec.potentialLift || 0,
        });
      }
    }

    // Also extract from requirement matches
    if (evalData.requirementMatches) {
      for (const match of evalData.requirementMatches) {
        if (match.matchState === 'MISSING' && match.requirement) {
          // Check if this gap is already in the list
          const existing = gaps.find(
            (g) => g.skill.name.toLowerCase() === match.requirement?.label.toLowerCase()
          );
          if (!existing && match.requirement) {
            gaps.push({
              id: match.id,
              skill: {
                id: match.requirement.id,
                name: match.requirement.label,
                category: 'Unknown',
              },
              priority: 'high',
              reason: `Required skill for ${evalData.jobVersion?.title || 'job'}`,
              recommendation: 'Learn this skill to improve eligibility',
              steps: [],
              potentialMatchImprovement: Math.round(match.contribution * 100),
            });
          }
        }
      }
    }
  }

  // Sort by potential improvement (descending) then by priority
  gaps.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const improvementDiff = b.potentialMatchImprovement - a.potentialMatchImprovement;
    if (improvementDiff !== 0) return improvementDiff;
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // Return only high priority gaps
  return gaps.filter((g) => g.priority === 'high').slice(0, 3);
}

/**
 * Get recent applications for the dashboard
 */
export function getRecentApplications(
  applications: BackendApplication[]
): BackendApplication[] {
  if (!applications || applications.length === 0) return [];
  
  // Sort by appliedAt (newest first) and take top 5
  return [...applications]
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 5);
}

/**
 * Get recommended jobs for the dashboard
 * For now, just return the first few published jobs
 */
export function getRecommendedJobs(jobs: BackendJob[]): BackendJob[] {
  if (!jobs || jobs.length === 0) return [];
  
  // Filter published jobs and sort by deadline (soonest first)
  return [...jobs]
    .filter((j) => j.status === 'PUBLISHED')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);
}

// ─── Helper to convert backend types to frontend types ────────────────

/**
 * Convert backend student to frontend Student type
 */
export function convertToFrontendStudent(backendStudent: BackendStudent): Student {
  return mapBackendStudentToFrontend(backendStudent);
}

/**
 * Convert backend job to frontend Job type
 */
export function convertToFrontendJob(backendJob: BackendJob): Job {
  return mapBackendJobToFrontend(backendJob);
}

/**
 * Convert backend application to frontend Application type
 */
export function convertToFrontendApplication(
  backendApp: BackendApplication
): Application {
  return mapBackendApplicationToFrontend(backendApp);
}
