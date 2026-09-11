import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/request';
import * as studentsService from '@/lib/services/students.service';
import * as evaluationsService from '@/lib/services/evaluations.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';

// ─── GET /students/me/evaluations ────────────────────────────────────────────
// STUDENT only — list all evaluations for the authenticated student

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
    if (!student) return notFoundError('Student profile');

    const evaluations = await evaluationsService.listStudentEvaluations(student.id);
    return successResponse(evaluations);
  } catch (error: unknown) {
    console.error('[STUDENTS_ME_EVALUATIONS_ERROR]', error);
    return internalError();
  }
}
