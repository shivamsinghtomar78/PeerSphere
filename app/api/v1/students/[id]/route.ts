import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/request';
import * as studentsService from '@/lib/services/students.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';
import { isApiError } from '@/lib/errors/api-error';

// ─── GET /students/:id ────────────────────────────────────────────────────────
// Get a single student by ID (admin only)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const { id } = await params;
    const student = await studentsService.getStudentById(id);

    if (!student) {
      return notFoundError('Student');
    }

    return successResponse(student);
  } catch (error: unknown) {
    if (isApiError(error) && error.statusCode === 404) {
      return notFoundError('Student');
    }
    console.error('[STUDENTS_GET_BY_ID_ERROR]', error);
    return internalError();
  }
}
