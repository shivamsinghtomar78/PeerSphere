import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/middleware';
import * as studentsService from '@/lib/services/students.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';
import { ApiError } from '@/lib/errors/api-error';

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(255).optional(),
});

// ─── GET /students/me ─────────────────────────────────────────────────────────
// Returns the authenticated student's own profile.

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'STUDENT') {
      return forbiddenError();
    }

    const student = await studentsService.getStudentByUserId(user.userId);
    const profile = await studentsService.getMyProfile(student.id);
    return successResponse(profile);
  } catch (error: any) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return notFoundError('Student profile');
    }
    console.error('[STUDENTS_ME_GET_ERROR]', error);
    return internalError();
  }
}

// ─── PATCH /students/me ───────────────────────────────────────────────────────
// Updates the authenticated student's editable profile fields.

export async function PATCH(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'STUDENT') {
      return forbiddenError();
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestError('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const student = await studentsService.getStudentByUserId(user.userId);
    const updated = await studentsService.updateMyProfile(student.id, parsed.data);
    return successResponse(updated);
  } catch (error: any) {
    if (error instanceof ApiError) {
      if (error.statusCode === 400) return badRequestError(error.message);
      if (error.statusCode === 404) return notFoundError('Student profile');
    }
    console.error('[STUDENTS_ME_PATCH_ERROR]', error);
    return internalError();
  }
}
