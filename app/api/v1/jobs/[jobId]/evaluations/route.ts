import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/request';
import * as evaluationsService from '@/lib/services/evaluations.service';
import * as jobsService from '@/lib/services/jobs.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';
import { isApiError } from '@/lib/errors/api-error';

// ─── GET /jobs/:jobId/evaluations ───────────────────────────────────────────
// List evaluations for a specific job

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

    // Verify job exists
    const job = await jobsService.getJobById(jobId);
    if (!job) {
      return notFoundError('Job');
    }

    // Only admin can see evaluations
    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    const evaluatorId = searchParams.get('evaluatorId');

    const evaluations = await evaluationsService.listEvaluationsByJob(jobId, {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      evaluatorId: evaluatorId ?? undefined,
    });

    return successResponse(evaluations);
  } catch (error: unknown) {
    if (isApiError(error) && error.statusCode === 404) {
      return notFoundError('Job');
    }
    console.error('[JOBS_EVALUATIONS_GET_ERROR]', error);
    return internalError();
  }
}
