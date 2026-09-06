import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/middleware';
import * as studentsService from '@/lib/services/students.service';
import * as evaluationsService from '@/lib/services/evaluations.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';

const queueBodySchema = z.object({
  studentId: z.string().uuid().optional(),
});

const listAllEvaluationsQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

// ─── GET /evaluations ───────────────────────────────────────────────
// PLACEMENT_ADMIN only — list all evaluations with pagination

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const query = listAllEvaluationsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const evaluations = await evaluationsService.listAllEvaluations(query);
    return successResponse(evaluations);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return badRequestError('Validation failed', error.flatten().fieldErrors);
    }
    console.error('[EVALUATIONS_GET_ALL_ERROR]', error);
    return internalError();
  }
}

// ─── POST /evaluations ───────────────────────────────────────────────────────
// Queue evaluation - alias for /evaluations/queue

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (!['STUDENT', 'PLACEMENT_ADMIN'].includes(user.role)) {
      return forbiddenError();
    }

    const body = await request.json();
    const parsed = queueBodySchema.safeParse(body);
    if (!parsed.success) {
      return badRequestError('Validation failed', parsed.error.flatten().fieldErrors);
    }

    let studentId: string;

    if (user.role === 'STUDENT') {
      const student = await studentsService.getStudentByUserId(user.userId);
      if (!student) return notFoundError('Student profile');
      studentId = student.id;
    } else {
      if (!parsed.data.studentId) {
        return badRequestError('studentId is required for PLACEMENT_ADMIN');
      }
      studentId = parsed.data.studentId;
    }

    // We need jobId too - check if it's in the body
    const { jobId } = body;
    if (!jobId) {
      return badRequestError('jobId is required');
    }

    const evaluation = await evaluationsService.queueEvaluation(studentId, jobId);
    return successResponse(evaluation, undefined, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return badRequestError('Validation failed', error.flatten().fieldErrors);
    }
    if (error.statusCode === 404) {
      return notFoundError(error.message);
    }
    console.error('[EVALUATIONS_POST_ERROR]', error);
    return internalError();
  }
}
