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

// ─── DELETE /students/me/skills/:skillId ───────────────────────────────
// Removes a skill from the authenticated student's profile.

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorizedError();
    if (user.role !== 'STUDENT') return forbiddenError();

    const { skillId } = await params;
    const student = await studentsService.getStudentByUserId(user.userId);
    await studentsService.removeSkill(student.id, skillId);
    return successResponse({ removed: true, skillId });
  } catch (error: unknown) {
    if (isApiError(error)) {
      if (error.statusCode === 404) return notFoundError('Skill evidence');
    }
    console.error('[STUDENTS_ME_SKILLS_DELETE_ERROR]', error);
    return internalError();
  }
}