import { NextRequest } from 'next/server';
import { getAuthUser } from '@/middleware';
import * as studentsService from '@/lib/services/students.service';
import * as applicationsService from '@/lib/services/applications.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';

// ─── GET /students/me/applications ─────────────────────────────────────────
// Returns the authenticated student's applications

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
    const applications = await applicationsService.listMyApplications(student.id);
    return successResponse(applications);
  } catch (error: any) {
    if (error.message === 'Student profile not found') {
      return notFoundError('Student profile');
    }
    if (error.statusCode === 404) {
      return notFoundError('Student');
    }
    console.error('[STUDENTS_ME_APPLICATIONS_ERROR]', error);
    return internalError();
  }
}
