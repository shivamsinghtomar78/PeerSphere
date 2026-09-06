import { NextRequest } from 'next/server';
import { getAuthUser } from '@/middleware';
import * as analyticsService from '@/lib/services/analytics.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  internalError,
} from '@/lib/api/response';

// ─── GET /analytics/skill-gaps ──────────────────────────────────────────────
// Returns the top 10 skills most frequently MISSING in RequirementMatch records.

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const data = await analyticsService.getSkillGaps();
    return successResponse(data);
  } catch (error: any) {
    console.error('[ANALYTICS_SKILL_GAPS_ERROR]', error);
    return internalError();
  }
}
