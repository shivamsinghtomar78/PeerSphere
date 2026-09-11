import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/request';
import * as analyticsService from '@/lib/services/analytics.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  internalError,
} from '@/lib/api/response';

// ─── GET /analytics/placement-stats ──────────────────────────────────────────
// Returns aggregate placement statistics for the current batch.

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const data = await analyticsService.getPlacementStats();
    return successResponse(data);
  } catch (error: unknown) {
    console.error('[ANALYTICS_PLACEMENT_STATS_ERROR]', error);
    return internalError();
  }
}
