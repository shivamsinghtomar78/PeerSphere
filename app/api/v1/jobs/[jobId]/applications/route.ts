import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth/request';
import * as applicationsService from '@/lib/services/applications.service';
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

// ─── GET /jobs/:jobId/applications ───────────────────────────────────────────
// List applications for a specific job (admin or assigned evaluator only)

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

    // Only admin can see applications
    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    const status = searchParams.get('status');

    const applications = await applicationsService.listApplicationsByJob(jobId, {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      status: status ?? undefined,
    });

    return successResponse(applications);
  } catch (error: unknown) {
    console.error('[JOBS_APPLICATIONS_GET_ERROR]', error);
    return internalError();
  }
}
