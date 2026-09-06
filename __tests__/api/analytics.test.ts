/**
 * Integration: analytics + reports. Expected values are computed
 * independently from the test DB at assertion time, so the suite validates
 * the aggregation logic regardless of what other suites created.
 */
import { NextRequest } from 'next/server';
import { GET as placementStats } from '@/app/api/v1/analytics/placement-stats/route';
import { GET as skillGaps } from '@/app/api/v1/analytics/skill-gaps/route';
import { GET as reports } from '@/app/api/v1/reports/route';
import { prisma } from '@/lib/db/prisma';

let adminUserId: string;
let studentUserId: string;

beforeAll(async () => {
  adminUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'placement@college.edu' } })).id;
  studentUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'arjun.sharma@college.edu' } })).id;
});

afterAll(() => prisma.$disconnect());

function req(path: string, user?: [string, 'STUDENT' | 'PLACEMENT_ADMIN']): NextRequest {
  const headers: Record<string, string> = {};
  if (user) {
    headers['x-user-id'] = user[0];
    headers['x-user-role'] = user[1];
  }
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

describe('GET /analytics/placement-stats', () => {
  it('is admin-only', async () => {
    expect((await placementStats(req('/api/v1/analytics/placement-stats', [studentUserId, 'STUDENT']))).status).toBe(403);
    expect((await placementStats(req('/api/v1/analytics/placement-stats'))).status).toBe(401);
  });

  it('numbers match independent DB aggregation', async () => {
    const res = await placementStats(req('/api/v1/analytics/placement-stats', [adminUserId, 'PLACEMENT_ADMIN']));
    expect(res.status).toBe(200);
    const { data } = await res.json();

    const [students, publishedJobs, applications, shortlisted] = await Promise.all([
      prisma.student.count(),
      prisma.job.count({ where: { status: 'PUBLISHED' } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: 'SHORTLISTED' } }),
    ]);

    expect(data.totalStudents).toBe(students);
    expect(data.activeJobs).toBe(publishedJobs);
    expect(data.totalApplications).toBe(applications);
    expect(data.shortlisted).toBe(shortlisted);

    // placement rate = students with ≥1 accepted offer / total students
    const placed = await prisma.application.groupBy({ by: ['studentId'], where: { status: 'OFFER_ACCEPTED' } });
    const expectedRate = students > 0 ? Math.round((placed.length / students) * 10000) / 100 : 0;
    expect(data.placementRate).toBe(expectedRate);

    // avg score matches the evaluation aggregate the service defines
    const agg = await prisma.evaluation.aggregate({
      where: { status: { in: ['COMPLETED', 'REVIEW_REQUIRED'] } },
      _avg: { overallScore: true },
    });
    const expectedAvg =
      agg._avg.overallScore !== null ? Math.round(agg._avg.overallScore * 100) / 100 : null;
    expect(data.avgMatchScore).toBe(expectedAvg);
  });
});

describe('GET /analytics/skill-gaps', () => {
  it('returns top missing skills ordered by count, admin-only', async () => {
    expect((await skillGaps(req('/api/v1/analytics/skill-gaps', [studentUserId, 'STUDENT']))).status).toBe(403);

    const res = await skillGaps(req('/api/v1/analytics/skill-gaps', [adminUserId, 'PLACEMENT_ADMIN']));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    const gaps = data.skillGaps ?? data;
    expect(Array.isArray(gaps)).toBe(true);
    // ordered descending by count
    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i - 1].count).toBeGreaterThanOrEqual(gaps[i].count);
    }
    // total MISSING matches in DB is >= the sum of the reported top-10 counts
    const missing = await prisma.requirementMatch.count({ where: { matchState: 'MISSING' } });
    const reported = gaps.reduce((s: number, g: { count: number }) => s + g.count, 0);
    expect(missing).toBeGreaterThanOrEqual(reported);
  });
});

describe('GET /reports', () => {
  it('paginated catalog, admin-only', async () => {
    expect((await reports(req('/api/v1/reports', [studentUserId, 'STUDENT']))).status).toBe(403);

    const res = await reports(req('/api/v1/reports?page=1&pageSize=5', [adminUserId, 'PLACEMENT_ADMIN']));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    const items = data.items ?? data.reports ?? data;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeLessThanOrEqual(5);
  });
});
