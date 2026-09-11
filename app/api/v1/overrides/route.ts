import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/request';
import * as overridesService from '@/lib/services/overrides.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  internalError,
} from '@/lib/api/response';
// ─── GET /overrides ────────────────────────────────────────────────────────────
// List all overrides with optional filtering

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
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');

    const result = await overridesService.listAuditEvents({
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      action: action ?? undefined,
      resourceType: resourceType ?? undefined,
    });

    return successResponse(result);
  } catch (error: unknown) {
    console.error('[OVERRIDES_GET_ERROR]', error);
    return internalError();
  }
}
