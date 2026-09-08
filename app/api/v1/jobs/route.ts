import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/middleware';
import * as jobsService from '@/lib/services/jobs.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  internalError,
} from '@/lib/api/response';

// ─── Validation Schemas ───────────────────────────────────────────

const listJobsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).optional(),
  department: z.string().trim().optional(),
});

const createJobSchema = z.object({
  title: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  location: z.string().min(1).max(255),
  workMode: z.enum(['ONSITE', 'REMOTE', 'HYBRID']),
  jobType: z.enum(['FULL_TIME', 'INTERNSHIP', 'CONTRACT']),
  salary: z.string().max(100).optional(),
  description: z.string().min(1),
  deadline: z.string().datetime({ message: 'deadline must be an ISO 8601 datetime string' }),
  minCgpa: z.number().min(0).max(10).optional(),
  maxBacklogs: z.number().int().min(0),
  allowedDepartments: z.array(z.string().min(1)).min(1),
  allowedPrograms: z.array(z.string().min(1)).min(1),
  requiredSkills: z.array(z.string().min(1)).default([]),
  preferredSkills: z.array(z.string().min(1)).default([]),
});

// ─── Routes ───────────────────────────────────────────────────────

// GET /jobs — list jobs (public shows PUBLISHED only; other statuses are admin-only)
export async function GET(request: NextRequest) {
  try {
    const query = listJobsSchema.parse(Object.fromEntries(request.nextUrl.searchParams));

    const user = getAuthUser(request);
    const isAdmin = user?.role === 'PLACEMENT_ADMIN';

    if (query.status && query.status !== 'PUBLISHED' && !isAdmin) {
      return forbiddenError('Only placement admins can list unpublished jobs');
    }

    // Admins see every status by default (they manage drafts); everyone else
    // is pinned to PUBLISHED inside the service.
    const data = await jobsService.listJobs(query, { allStatusesByDefault: isAdmin });
    return successResponse(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return badRequestError('Validation failed', error.flatten().fieldErrors);
    }
    console.error('[JOBS_GET_ERROR]', error);
    return internalError();
  }
}

// POST /jobs — create job (PLACEMENT_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const dto = createJobSchema.parse(await request.json());
    const data = await jobsService.createJob(user.userId, dto);
    return successResponse(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return badRequestError('Validation failed', error.flatten().fieldErrors);
    }
    console.error('[JOBS_POST_ERROR]', error);
    return internalError();
  }
}
