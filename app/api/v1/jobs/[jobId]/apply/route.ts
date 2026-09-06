import { NextRequest } from 'next/server';
import { getAuthUser } from '@/middleware';
import * as applicationsService from '@/lib/services/applications.service';
import * as studentsService from '@/lib/services/students.service';
import * as jobsService from '@/lib/services/jobs.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  unprocessableError,
  internalError,
} from '@/lib/api/response';
import { ApiError } from '@/lib/errors/api-error';

// ─── POST /jobs/:jobId/apply ────────────────────────────────────────────────
// Student applies to a job. The latest resume version is attached automatically.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'STUDENT') {
      return forbiddenError();
    }

    const { jobId } = await params;

    // Verify job exists
    const job = await jobsService.getJobById(jobId);
    if (!job) {
      return notFoundError('Job');
    }

    const student = await studentsService.getStudentByUserId(user.userId);
    if (!student) {
      return notFoundError('Student profile');
    }

    const result = await applicationsService.applyToJob(student.id, jobId);

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
    if (error instanceof ApiError) {
      if (error.statusCode === 400) return badRequestError(error.message);
      if (error.statusCode === 404) return notFoundError(error.message);
      if (error.statusCode === 422) return unprocessableError(error.message, error.details);
    }
    console.error('[JOBS_APPLY_POST_ERROR]', error);
    return internalError();
  }
}