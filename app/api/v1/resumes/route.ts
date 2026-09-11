import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/request';
import * as resumesService from '@/lib/services/resumes.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  internalError,
} from '@/lib/api/response';

// ─── GET /resumes ─────────────────────────────────────────────────────────────
// List all resumes (admin only)

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (studentId) {
      const resumes = await resumesService.listResumes(studentId);
      return successResponse({ resumes, total: resumes.length });
    }

    // List all resumes for all students (admin view)
    // This is a placeholder - in production you'd want pagination
    return successResponse({ message: 'Use /students/:id/resumes or /students/me/resumes' });
  } catch (error: unknown) {
    console.error('[RESUMES_GET_ERROR]', error);
    return internalError();
  }
}
