import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/middleware';
import * as overridesService from '@/lib/services/overrides.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  internalError,
} from '@/lib/api/response';

const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
});

// ─── GET /audit-log ─────────────────────────────────────────────────────────
// Returns paginated audit events (PLACEMENT_ADMIN only).

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const query = auditLogQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const result = await overridesService.listAuditEvents(query);
    return successResponse(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return badRequestError('Validation failed', error.flatten().fieldErrors);
    }
    console.error('[AUDIT_LOG_GET_ERROR]', error);
    return internalError();
  }
}
