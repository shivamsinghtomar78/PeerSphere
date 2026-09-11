import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth/request';
import * as overridesService from '@/lib/services/overrides.service';
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

// ─── POST /evaluations/:evaluationId/override ────────────────────────────────
// Create a review override for an evaluation

const createOverrideSchema = z.object({
  decision: z.enum(['shortlist', 'reject', 'review', 'promote']),
  reason: z.string().min(1, 'Reason is required').trim(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    // Only PLACEMENT_ADMIN can create overrides
    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const { evaluationId } = await params;
    const body = await request.json();
    const parsed = createOverrideSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestError('Validation failed', parsed.error.flatten().fieldErrors);
    }

    // Verify evaluation exists
    const evaluation = await evaluationsService.getEvaluationById(evaluationId);
    if (!evaluation) {
      return notFoundError('Evaluation');
    }

    const override = await overridesService.createOverride(
      evaluationId,
      user.userId,
      parsed.data.decision,
      parsed.data.reason
    );

    return successResponse(override, 'Override created successfully', 201);
  } catch (error: unknown) {
    if (isApiError(error)) {
      if (error.statusCode === 400) return badRequestError(error.message);
      if (error.statusCode === 404) return notFoundError('Evaluation');
    }
    console.error('[OVERRIDE_POST_ERROR]', error);
    return internalError();
  }
}
