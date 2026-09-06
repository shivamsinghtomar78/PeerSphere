import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/middleware';
import * as applicationsService from '@/lib/services/applications.service';
import { STUDENT_ALLOWED_TARGET_STATUSES } from '@/lib/services/applications.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  conflictError,
  internalError,
} from '@/lib/api/response';
import { ApiError } from '@/lib/errors/api-error';

// Ownership: Application.studentId is the Student row id; the authenticated
// principal is a User id — always compare via student.userId.
type OwnedApplication = { student: { userId: string } };
const ownedBy = (application: OwnedApplication, userId: string) =>
  application.student.userId === userId;

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

    // Admin sees all; a student only their own
    if (user.role !== 'PLACEMENT_ADMIN' && !ownedBy(application, user.userId)) {
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
// Status changes go through the transition-enforced, audited service path.
// Admin: any legal transition. Student: only WITHDRAWN, only on their own.

const updateApplicationSchema = z.object({
  status: z
    .enum([
      'APPLIED',
      'UNDER_REVIEW',
      'SHORTLISTED',
      'INTERVIEW_SCHEDULED',
      'OFFER_EXTENDED',
      'OFFER_ACCEPTED',
      'REJECTED',
      'WITHDRAWN',
    ])
    .optional(),
  notes: z.string().trim().max(2000).optional(),
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

    const application = await applicationsService.getApplicationById(id);
    const isOwner = ownedBy(application, user.userId);

    if (user.role !== 'PLACEMENT_ADMIN' && !isOwner) {
      return forbiddenError();
    }

    const { status, notes } = parsed.data;

    if (status) {
      if (
        user.role !== 'PLACEMENT_ADMIN' &&
        !STUDENT_ALLOWED_TARGET_STATUSES.includes(status as never)
      ) {
        return forbiddenError('Students can only withdraw their own applications');
      }
      const updated = await applicationsService.updateApplicationStatus(
        id,
        status,
        user.userId,
        notes
      );
      return successResponse(updated);
    }

    if (notes !== undefined) {
      const updated = await applicationsService.updateApplication(id, { notes });
      return successResponse(updated);
    }

    return badRequestError('Nothing to update — provide status and/or notes');
  } catch (error: any) {
    if (error instanceof ApiError) {
      if (error.statusCode === 404) return notFoundError('Application');
      if (error.statusCode === 400) return badRequestError(error.message);
      if (error.statusCode === 409) return conflictError(error.message);
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

    const application = await applicationsService.getApplicationById(id);
    if (user.role !== 'PLACEMENT_ADMIN' && !ownedBy(application, user.userId)) {
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
