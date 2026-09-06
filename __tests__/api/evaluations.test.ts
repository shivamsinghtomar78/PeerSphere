/**
 * Integration: evaluation queue idempotency (snapshot hash), snapshot-change
 * behaviour, detail explainability, and access control.
 */
import { NextRequest } from 'next/server';
import { GET as listEvaluations } from '@/app/api/v1/evaluations/route';
import { POST as queueEvaluation } from '@/app/api/v1/evaluations/queue/route';
import { GET as getEvaluation } from '@/app/api/v1/evaluations/[evaluationId]/route';
import { POST as addSkill } from '@/app/api/v1/students/me/skills/route';
import { DELETE as removeSkill } from '@/app/api/v1/students/me/skills/[skillId]/route';
import { prisma } from '@/lib/db/prisma';

let adminUserId: string;
let studentUserId: string; // arjun
let otherStudentUserId: string; // priya
let studentId: string; // arjun's Student row
let publishedJobId: string;

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

beforeAll(async () => {
  adminUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'placement@college.edu' } })).id;
  studentUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'arjun.sharma@college.edu' } })).id;
  otherStudentUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'priya.nair@college.edu' } })).id;
  studentId = (await prisma.student.findFirstOrThrow({ where: { userId: studentUserId } })).id;
  publishedJobId = (await prisma.job.findFirstOrThrow({ where: { status: 'PUBLISHED' } })).id;
});

afterAll(() => prisma.$disconnect());

const queueBody = () => ({ studentId, jobId: publishedJobId });

describe('POST /evaluations/queue — snapshot-hash idempotency', () => {
  it('queueing twice with identical inputs creates exactly one evaluation', async () => {
    const first = await queueEvaluation(
      req('/api/v1/evaluations/queue', { method: 'POST', user: [studentUserId, 'STUDENT'], body: queueBody() })
    );
    expect(first.status).toBe(201);
    const evalA = (await first.json()).data;

    const second = await queueEvaluation(
      req('/api/v1/evaluations/queue', { method: 'POST', user: [studentUserId, 'STUDENT'], body: queueBody() })
    );
    const evalB = (await second.json()).data;

    expect(evalB.id).toBe(evalA.id); // same row returned
    const rows = await prisma.evaluation.count({ where: { snapshotHash: evalA.snapshotHash } });
    expect(rows).toBe(1);
  });

  it('changing the student skills changes the snapshot → a new evaluation row', async () => {
    const before = await queueEvaluation(
      req('/api/v1/evaluations/queue', { method: 'POST', user: [studentUserId, 'STUDENT'], body: queueBody() })
    );
    const evalBefore = (await before.json()).data;

    // mutate inputs: add a taxonomy skill arjun doesn't have
    const owned = await prisma.studentSkillEvidence.findMany({ where: { studentId } });
    const fresh = await prisma.skill.findFirstOrThrow({ where: { id: { notIn: owned.map((o) => o.skillId) } } });
    await addSkill(
      req('/api/v1/students/me/skills', {
        method: 'POST',
        user: [studentUserId, 'STUDENT'],
        body: { skillName: fresh.canonicalName },
      })
    );

    const after = await queueEvaluation(
      req('/api/v1/evaluations/queue', { method: 'POST', user: [studentUserId, 'STUDENT'], body: queueBody() })
    );
    const evalAfter = (await after.json()).data;

    expect(evalAfter.id).not.toBe(evalBefore.id);
    expect(evalAfter.snapshotHash).not.toBe(evalBefore.snapshotHash);

    // cleanup: remove the skill again
    await removeSkill(
      req(`/api/v1/students/me/skills/${fresh.id}`, { method: 'DELETE', user: [studentUserId, 'STUDENT'] }),
      { params: Promise.resolve({ skillId: fresh.id }) } as never
    );
  });

  it('a student cannot queue for another student (studentId in body is ignored)', async () => {
    const res = await queueEvaluation(
      req('/api/v1/evaluations/queue', {
        method: 'POST',
        user: [otherStudentUserId, 'STUDENT'],
        body: queueBody(), // arjun's studentId — must be overridden with priya's own
      })
    );
    expect([200, 201]).toContain(res.status);
    const evaluation = (await res.json()).data;
    expect(evaluation.studentId).not.toBe(studentId);
  });
});

describe('evaluation detail — explainability and access control', () => {
  let seededEvaluationId: string;

  beforeAll(async () => {
    // any engine-produced evaluation (has requirement matches + a score)
    seededEvaluationId = (
      await prisma.evaluation.findFirstOrThrow({
        where: { studentId, requirementMatches: { some: {} }, overallScore: { not: null } },
        orderBy: { createdAt: 'asc' },
      })
    ).id;
  });

  const detailCtx = (id: string) => ({ params: Promise.resolve({ evaluationId: id }) }) as never;

  it('owner sees scores + per-requirement explanations + recommendations', async () => {
    const res = await getEvaluation(
      req(`/api/v1/evaluations/${seededEvaluationId}`, { user: [studentUserId, 'STUDENT'] }),
      detailCtx(seededEvaluationId)
    );
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.overallScore).toEqual(expect.any(Number));
    expect(data.requirementMatches.length).toBeGreaterThan(0);
    expect(data.requirementMatches[0]).toHaveProperty('explanation');
    expect(data).toHaveProperty('recommendations');
  });

  it("another student cannot read someone else's evaluation → 403", async () => {
    const res = await getEvaluation(
      req(`/api/v1/evaluations/${seededEvaluationId}`, { user: [otherStudentUserId, 'STUDENT'] }),
      detailCtx(seededEvaluationId)
    );
    expect(res.status).toBe(403);
  });

  it('admin reads any evaluation; the collection is admin-only', async () => {
    const res = await getEvaluation(
      req(`/api/v1/evaluations/${seededEvaluationId}`, { user: [adminUserId, 'PLACEMENT_ADMIN'] }),
      detailCtx(seededEvaluationId)
    );
    expect(res.status).toBe(200);

    expect((await listEvaluations(req('/api/v1/evaluations', { user: [adminUserId, 'PLACEMENT_ADMIN'] }))).status).toBe(200);
    expect((await listEvaluations(req('/api/v1/evaluations', { user: [studentUserId, 'STUDENT'] }))).status).toBe(403);
  });
});
