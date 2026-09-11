import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth/request';
import * as studentsService from '@/lib/services/students.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  internalError,
} from '@/lib/api/response';

// ─── Validation Schemas ──────────────────────────────────────────────────

const listStudentsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
});

// GET /students - List all students (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const query = listStudentsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const data = await studentsService.listStudents(query);
    return successResponse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return badRequestError('Validation failed', error.flatten().fieldErrors);
    }
    console.error('[STUDENTS_GET_ALL_ERROR]', error);
    return internalError();
  }
}

// This file handles GET /students (list all) - for /students/me see me/route.ts
// Other student routes are in separate files
