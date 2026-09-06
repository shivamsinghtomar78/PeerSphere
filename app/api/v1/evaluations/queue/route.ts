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

const queueEvaluationSchema = z.object({
  studentId: z.string().uuid(),
  jobId: z.string().uuid(),
});

// ─── POST /evaluations/queue ────────────────────────────────────────────────
// Queue an evaluation for a student and job

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
    const parsed = queueEvaluationSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestError('Validation failed', parsed.error.flatten().fieldErrors);
    }

    let studentId: string;

    if (user.role === 'STUDENT') {
      // Students can only queue for themselves
      const student = await studentsService.getStudentByUserId(user.userId);
      if (!student) return notFoundError('Student profile');
      studentId = student.id;
    } else {
      // PLACEMENT_ADMIN can queue for any student
      studentId = parsed.data.studentId;
    }

    const evaluation = await evaluationsService.queueEvaluation(studentId, parsed.data.jobId);
    return successResponse(evaluation, undefined, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return badRequestError('Validation failed', error.flatten().fieldErrors);
    }
    if (error.statusCode === 404) {
      return notFoundError(error.message);
    }
    console.error('[EVALUATIONS_QUEUE_ERROR]', error);
    return internalError();
  }
}
