import { NextRequest } from 'next/server';
import { isApiError } from '@/lib/errors/api-error';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/request';
import * as studentsService from '@/lib/services/students.service';
import * as resumesService from '@/lib/services/resumes.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';

// ─── DELETE /students/me/resumes/:id ──────────────────────────────────────────
// Soft-delete a resume version (sets deletedAt + state=DELETED, file stays on disk).

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'STUDENT') {
      return forbiddenError();
    }

    const { id } = await params;
    const student = await studentsService.getStudentByUserId(user.userId);
    if (!student) return notFoundError('Student profile');

    const deleted = await resumesService.deleteResume(student.id, id);
    return successResponse(deleted);
  } catch (error: unknown) {
    if (isApiError(error) && error.statusCode === 404) {
      return notFoundError(error.message);
    }
    console.error('[RESUMES_DELETE_ERROR]', error);
    return internalError();
  }
}
