import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/middleware';
import * as studentsService from '@/lib/services/students.service';
import * as applicationsService from '@/lib/services/applications.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  unprocessableError,
  internalError,
} from '@/lib/api/response';

// ─── Validation schemas ───────────────────────────────────────────────────────

const updateStatusSchema = z.object({
  status: z.string().min(1),
  notes: z.string().optional(),
});

const listJobApplicationsQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const listAllApplicationsQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

// ─── Helper ─────────────────────────────────────────────────────────────────

const getStudentId = async (userId: string) => {
  const student = await studentsService.getStudentByUserId(userId);
  if (!student) {
    throw new Error('Student profile not found');
  }
  return student.id;
};

// ─── POST /applications ───────────────────────────────────────────────────────
// Student applies to a published job
// This is accessed via POST /jobs/:jobId/apply in the frontend
// But we also support direct POST /applications for backwards compatibility

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'STUDENT') {
      return forbiddenError();
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return badRequestError('jobId is required');
    }

    const studentId = await getStudentId(user.userId);
    const result = await applicationsService.applyToJob(studentId, jobId);

    const statusCode = result.alreadyExists ? 200 : 201;
    return successResponse(
      {
        application: result.application,
        alreadyExists: result.alreadyExists,
        ...(result.alreadyExists && {
          note: 'You have already applied to this job.',
        }),
      },
      undefined,
      statusCode as 200 | 201
    );
  } catch (error: any) {
    if (error.statusCode === 400) {
      return badRequestError(error.message);
    }
    if (error.statusCode === 404) {
      return notFoundError(error.message);
    }
    if (error.statusCode === 422) {
      return unprocessableError(error.message, error.details);
    }
    console.error('[APPLICATIONS_POST_ERROR]', error);
    return internalError();
  }
}

// ─── GET /applications ───────────────────────────────────────────────────────
// Returns all paginated applications (PLACEMENT_ADMIN only)

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const query = listAllApplicationsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const result = await applicationsService.listAllApplications(query);
    return successResponse(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return badRequestError('Validation failed', error.flatten().fieldErrors);
    }
    console.error('[APPLICATIONS_GET_ALL_ERROR]', error);
    return internalError();
  }
}
