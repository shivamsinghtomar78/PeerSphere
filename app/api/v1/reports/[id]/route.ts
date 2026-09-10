import { NextRequest } from 'next/server';
import { getAuthUser } from '@/middleware';
import * as analyticsService from '@/lib/services/analytics.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';

// ─── GET /reports/:id ─────────────────────────────────────────────────────
// Generates the report content live from the database: title, category, and
// sections of label/value rows. The frontend renders it as a summary dialog
// and offers a CSV download built from the same rows.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return unauthorizedError();
    }

    if (user.role !== 'PLACEMENT_ADMIN') {
      return forbiddenError();
    }

    const { id } = await params;
    const report = await analyticsService.generateReport(id);
    if (!report) return notFoundError('Report');

    return successResponse(report);
  } catch (error: any) {
    console.error('[REPORT_GENERATE_ERROR]', error);
    return internalError();
  }
}
