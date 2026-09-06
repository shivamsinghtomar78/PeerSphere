/**
 * Integration: evaluation overrides (append-only, reasoned, audited)
 * + the audit-log route.
 */
import { NextRequest } from 'next/server';
import { POST as createOverride } from '@/app/api/v1/evaluations/[evaluationId]/override/route';
import { GET as listEvalOverrides } from '@/app/api/v1/evaluations/[evaluationId]/overrides/route';
import { GET as listOverrides } from '@/app/api/v1/overrides/route';
import { GET as auditLog } from '@/app/api/v1/audit-log/route';
import { prisma } from '@/lib/db/prisma';

let adminUserId: string;
let studentUserId: string;
let evaluationId: string;

function req(
  path: string,
  opts: { method?: string; user?: [string, 'STUDENT' | 'PLACEMENT_ADMIN']; body?: unknown } = {}
): NextRequest {
  const headers: Record<string, string> = {};
  if (opts.user) {
    headers['x-user-id'] = opts.user[0];
    headers['x-user-role'] = opts.user[1];
  }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  return new NextRequest(`http://localhost:3000${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

const ctx = (id: string) => ({ params: Promise.resolve({ evaluationId: id }) }) as never;

beforeAll(async () => {
  adminUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'placement@college.edu' } })).id;
  studentUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'arjun.sharma@college.edu' } })).id;
  evaluationId = (
    await prisma.evaluation.findFirstOrThrow({ where: { requirementMatches: { some: {} } } })
  ).id;
});

afterAll(() => prisma.$disconnect());

describe('POST /evaluations/[id]/override', () => {
  it('missing reason → 400; bad decision → 400; student → 403', async () => {
    const noReason = await createOverride(
      req(`/api/v1/evaluations/${evaluationId}/override`, {
        method: 'POST', user: [adminUserId, 'PLACEMENT_ADMIN'], body: { decision: 'shortlist', reason: '' },
      }),
      ctx(evaluationId)
    );
    expect(noReason.status).toBe(400);

    const badDecision = await createOverride(
      req(`/api/v1/evaluations/${evaluationId}/override`, {
        method: 'POST', user: [adminUserId, 'PLACEMENT_ADMIN'], body: { decision: 'yeet', reason: 'because' },
      }),
      ctx(evaluationId)
    );
    expect(badDecision.status).toBe(400);

    const student = await createOverride(
      req(`/api/v1/evaluations/${evaluationId}/override`, {
        method: 'POST', user: [studentUserId, 'STUDENT'], body: { decision: 'shortlist', reason: 'me please' },
      }),
      ctx(evaluationId)
    );
    expect(student.status).toBe(403);
  });

  it('valid override → created, listed chronologically, audited', async () => {
    const auditBefore = await prisma.auditEvent.count({ where: { resourceId: evaluationId } });

    const res = await createOverride(
      req(`/api/v1/evaluations/${evaluationId}/override`, {
        method: 'POST',
        user: [adminUserId, 'PLACEMENT_ADMIN'],
        body: { decision: 'shortlist', reason: 'Strong practical portfolio despite low coverage' },
      }),
      ctx(evaluationId)
    );
    expect([200, 201]).toContain(res.status);

    const list = await listEvalOverrides(
      req(`/api/v1/evaluations/${evaluationId}/overrides`, { user: [adminUserId, 'PLACEMENT_ADMIN'] }),
      ctx(evaluationId)
    );
    expect(list.status).toBe(200);
    const { data } = await list.json();
    const overrides = data.overrides ?? data.items ?? data;
    expect(overrides.length).toBeGreaterThanOrEqual(1);
    expect(overrides.some((o: { reason: string }) => o.reason.includes('practical portfolio'))).toBe(true);

    const auditAfter = await prisma.auditEvent.count({ where: { resourceId: evaluationId } });
    expect(auditAfter).toBeGreaterThan(auditBefore);
  });

  it('overrides are append-only — a second override adds a row, never replaces', async () => {
    const before = await prisma.reviewOverride.count({ where: { evaluationId } });
    await createOverride(
      req(`/api/v1/evaluations/${evaluationId}/override`, {
        method: 'POST',
        user: [adminUserId, 'PLACEMENT_ADMIN'],
        body: { decision: 'review', reason: 'Second thoughts — needs another look' },
      }),
      ctx(evaluationId)
    );
    expect(await prisma.reviewOverride.count({ where: { evaluationId } })).toBe(before + 1);
  });
});

describe('GET /overrides + /audit-log (admin only)', () => {
  it('overrides collection: admin 200, student 403', async () => {
    expect((await listOverrides(req('/api/v1/overrides', { user: [adminUserId, 'PLACEMENT_ADMIN'] }))).status).toBe(200);
    expect((await listOverrides(req('/api/v1/overrides', { user: [studentUserId, 'STUDENT'] }))).status).toBe(403);
  });

  it('audit log: admin 200 with entries, student 403', async () => {
    const res = await auditLog(req('/api/v1/audit-log', { user: [adminUserId, 'PLACEMENT_ADMIN'] }));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect((data.items ?? data).length).toBeGreaterThan(0);

    expect((await auditLog(req('/api/v1/audit-log', { user: [studentUserId, 'STUDENT'] }))).status).toBe(403);
  });
});
