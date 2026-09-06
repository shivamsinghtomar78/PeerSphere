import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/middleware';
import * as applicationsService from '@/lib/services/applications.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';
import { ApiError } from '@/lib/errors/api-error';

// ─── GET /applications/:id ──────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    const { id } = await params;
    const application = await applicationsService.getApplicationById(id);

    // Check permissions: admin can see all, student can only see their own
    if (user.role !== 'PLACEMENT_ADMIN' && application.studentId !== user.userId) {
      return forbiddenError();
    }

    return successResponse(application);
  } catch (error: any) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return notFoundError('Application');
    }
    console.error('[APPLICATIONS_GET_BY_ID_ERROR]', error);
    return internalError();
  }
}

// ─── PATCH /applications/:id ────────────────────────────────────────────────

const updateApplicationSchema = z.object({
  status: z.enum(['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN']).optional(),
  notes: z.string().trim().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestError('Validation failed', parsed.error.flatten().fieldErrors);
    }

    // Only student who owns the application can update it (for status like WITHDRAWN)
    const application = await applicationsService.getApplicationById(id);
    if (application.studentId !== user.userId && user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const updated = await applicationsService.updateApplication(id, parsed.data);
    return successResponse(updated);
  } catch (error: any) {
    if (error instanceof ApiError) {
      if (error.statusCode === 404) return notFoundError('Application');
      if (error.statusCode === 400) return badRequestError(error.message);
    }
    console.error('[APPLICATIONS_PATCH_ERROR]', error);
    return internalError();
  }
}

// ─── DELETE /applications/:id ───────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    const { id } = await params;

    // Only student who owns the application or admin can delete
    const application = await applicationsService.getApplicationById(id);
    if (application.studentId !== user.userId && user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    await applicationsService.deleteApplication(id);
    return successResponse({ message: 'Application deleted successfully' });
  } catch (error: any) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return notFoundError('Application');
    }
    console.error('[APPLICATIONS_DELETE_ERROR]', error);
    return internalError();
  }
}
