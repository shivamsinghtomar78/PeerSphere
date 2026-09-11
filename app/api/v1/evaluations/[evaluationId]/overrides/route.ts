import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/request';
import * as overridesService from '@/lib/services/overrides.service';
import * as evaluationsService from '@/lib/services/evaluations.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';
import { isApiError } from '@/lib/errors/api-error';

// ─── GET /evaluations/:evaluationId/overrides ────────────────────────────────
// List all overrides for an evaluation

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

    // Verify evaluation exists and check permissions
    const evaluation = await evaluationsService.getEvaluationById(evaluationId);
    if (!evaluation) {
      return notFoundError('Evaluation');
    }

    // Only admin can see overrides
    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const overrides = await overridesService.listOverrides(evaluationId);

    return successResponse({
      overrides,
      total: overrides.length,
      evaluationId,
    });
  } catch (error: unknown) {
    if (isApiError(error) && error.statusCode === 404) {
      return notFoundError('Evaluation');
    }
    console.error('[OVERRIDES_GET_ERROR]', error);
    return internalError();
  }
}
