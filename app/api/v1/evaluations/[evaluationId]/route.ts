import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth/request';
import * as evaluationsService from '@/lib/services/evaluations.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';
import { isApiError } from '@/lib/errors/api-error';

// ─── GET /evaluations/:evaluationId ────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    const { evaluationId } = await params;
    const evaluation = await evaluationsService.getEvaluation(
      evaluationId,
      user.userId,
      user.role
    );

    if (!evaluation) {
      return notFoundError('Evaluation');
    }

    return successResponse(evaluation);
  } catch (error: unknown) {
    if (isApiError(error)) {
      if (error.statusCode === 404) return notFoundError('Evaluation');
      if (error.statusCode === 403) return forbiddenError();
    }
    console.error('[EVALUATIONS_GET_BY_ID_ERROR]', error);
    return internalError();
  }
}

// ─── PATCH /evaluations/:evaluationId ────────────────────────────────────────────

const updateEvaluationSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  decision: z.enum(['shortlist', 'reject', 'review']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    const { evaluationId } = await params;
    const body = await request.json();
    const parsed = updateEvaluationSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestError('Validation failed', parsed.error.flatten().fieldErrors);
    }

    // First get the evaluation to check permissions
    const evaluation = await evaluationsService.getEvaluation(
      evaluationId,
      user.userId,
      user.role
    );

    if (!evaluation) {
      return notFoundError('Evaluation');
    }

    // Only assigned evaluator or admin can update
    // Note: getEvaluation already checks permissions, so if we got here we're good

    const updated = await evaluationsService.updateEvaluation(
      evaluationId,
      parsed.data,
      user.userId
    );
    return successResponse(updated);
  } catch (error: unknown) {
    if (isApiError(error)) {
      if (error.statusCode === 404) return notFoundError('Evaluation');
      if (error.statusCode === 400) return badRequestError(error.message);
      if (error.statusCode === 403) return forbiddenError();
    }
    console.error('[EVALUATIONS_PATCH_ERROR]', error);
    return internalError();
  }
}
