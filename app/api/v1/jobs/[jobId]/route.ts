import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/middleware';
import * as jobsService from '@/lib/services/jobs.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';
import { ApiError } from '@/lib/errors/api-error';

const updateJobSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  company: z.string().min(1).max(255).optional(),
  location: z.string().min(1).max(255).optional(),
  workMode: z.enum(['ONSITE', 'REMOTE', 'HYBRID']).optional(),
  jobType: z.enum(['FULL_TIME', 'INTERNSHIP', 'CONTRACT']).optional(),
  salary: z.string().max(100).nullable().optional(),
  description: z.string().min(1).optional(),
  deadline: z.string().datetime({ message: 'deadline must be an ISO 8601 datetime string' }).optional(),
  minCgpa: z.number().min(0).max(10).nullable().optional(),
  maxBacklogs: z.number().int().min(0).optional(),
  allowedDepartments: z.array(z.string().min(1)).min(1).optional(),
  allowedPrograms: z.array(z.string().min(1)).min(1).optional(),
  requiredSkills: z.array(z.string().min(1)).optional(),
  preferredSkills: z.array(z.string().min(1)).optional(),
});

// ─── GET /jobs/:jobId ────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    const { jobId } = await params;
    const job = await jobsService.getJobById(jobId);

    // Students can see published jobs, admins can see all
    if (job.status !== 'PUBLISHED' && user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    return successResponse(job);
  } catch (error: any) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return notFoundError('Job');
    }
    console.error('[JOBS_GET_BY_ID_ERROR]', error);
    return internalError();
  }
}

// ─── PATCH /jobs/:jobId ──────────────────────────────────────────────────────
// Update job fields (PLACEMENT_ADMIN only)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const { jobId } = await params;
    const body = await request.json();
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestError('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const job = await jobsService.updateJob(jobId, {
      ...parsed.data,
      salary: parsed.data.salary ?? undefined,
      minCgpa: parsed.data.minCgpa ?? undefined,
    });
    return successResponse(job);
  } catch (error: any) {
    if (error instanceof ApiError) {
      if (error.statusCode === 400) return badRequestError(error.message);
      if (error.statusCode === 404) return notFoundError(error.message);
    }
    console.error('[JOBS_PATCH_ERROR]', error);
    return internalError();
  }
}
