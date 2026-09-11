import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/request';
import * as jobsService from '@/lib/services/jobs.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  conflictError,
  internalError,
} from '@/lib/api/response';
import { isApiError } from '@/lib/errors/api-error';

// ─── POST /jobs/:jobId/close ─────────────────────────────────────────────────
// Close a job (PLACEMENT_ADMIN only)

export async function POST(
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
    const job = await jobsService.closeJob(jobId);
    return successResponse(job);
  } catch (error: unknown) {
    if (isApiError(error)) {
      if (error.statusCode === 404) return notFoundError(error.message);
      if (error.statusCode === 409) return conflictError(error.message);
    }
    console.error('[JOBS_CLOSE_ERROR]', error);
    return internalError();
  }
}
