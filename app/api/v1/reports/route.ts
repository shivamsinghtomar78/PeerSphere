import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/request';
import * as analyticsService from '@/lib/services/analytics.service';
import {
  successResponse,
  unauthorizedError,
  forbiddenError,
  internalError,
} from '@/lib/api/response';

// ─── GET /reports ──────────────────────────────────────────────────────────
// Returns the available report catalog in a paginated shape so the frontend
// can render it as a list ({ items, total, page, pageSize, hasNext }).

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
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10))
    );

    const items = analyticsService.AVAILABLE_REPORTS.map((report) => ({
      id: report.id,
      title: report.title,
      category: report.category,
      description: report.description,
      generatedAt: report.lastGenerated,
      format: 'PDF / CSV Bundle',
      status: 'Ready',
    }));

    const start = (page - 1) * pageSize;

    return successResponse({
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
      hasNext: start + pageSize < items.length,
    });
  } catch (error: unknown) {
    console.error('[REPORTS_GET_ERROR]', error);
    return internalError();
  }
}
