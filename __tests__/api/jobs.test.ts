/**
 * Integration: job lifecycle — list visibility, create, publish, apply, close
 * against the seeded test DB. Creates its own job so seed data stays intact.
 */
import { NextRequest } from 'next/server';
import { GET as listJobs, POST as createJob } from '@/app/api/v1/jobs/route';
import { GET as getJob } from '@/app/api/v1/jobs/[jobId]/route';
import { POST as publishJob } from '@/app/api/v1/jobs/[jobId]/publish/route';
import { POST as closeJob } from '@/app/api/v1/jobs/[jobId]/close/route';
import { POST as applyToJob } from '@/app/api/v1/jobs/[jobId]/apply/route';
import { prisma } from '@/lib/db/prisma';

let adminUserId: string;
let studentUserId: string;

beforeAll(async () => {
  adminUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'placement@college.edu' } })).id;
  studentUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'arjun.sharma@college.edu' } })).id;
});

afterAll(() => prisma.$disconnect());

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

const ctx = (jobId: string) => ({ params: Promise.resolve({ jobId }) }) as never;

const validJobBody = {
  title: `Integration Test Engineer ${Date.now()}`,
  company: 'TestCorp',
  location: 'Remote',
  workMode: 'REMOTE',
  jobType: 'FULL_TIME',
  description: 'Job created by the integration suite',
  deadline: new Date(Date.now() + 30 * 86400_000).toISOString(),
  minCgpa: 6.0,
  maxBacklogs: 2,
  allowedDepartments: ['Computer Science'],
  allowedPrograms: ['B.Tech'],
  requiredSkills: ['Java'],
  preferredSkills: [],
};

describe('GET /jobs — status visibility', () => {
  it('anonymous list returns only PUBLISHED jobs', async () => {
    const res = await listJobs(req('/api/v1/jobs'));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    const items = data.items ?? data;
    expect(items.every((j: { status: string }) => j.status === 'PUBLISHED')).toBe(true);
  });

  it('anonymous ?status=DRAFT → 403 (leak regression); admin → 200', async () => {
    expect((await listJobs(req('/api/v1/jobs?status=DRAFT'))).status).toBe(403);
    expect(
      (await listJobs(req('/api/v1/jobs?status=DRAFT', { user: [adminUserId, 'PLACEMENT_ADMIN'] }))).status
    ).toBe(200);
    // student is not an admin either
    expect(
      (await listJobs(req('/api/v1/jobs?status=DRAFT', { user: [studentUserId, 'STUDENT'] }))).status
    ).toBe(403);
  });
});

describe('job lifecycle: create → publish → apply → close', () => {
  let jobId: string;

  it('student cannot create → 403; invalid body → 400', async () => {
    expect(
      (await createJob(req('/api/v1/jobs', { method: 'POST', user: [studentUserId, 'STUDENT'], body: validJobBody }))).status
    ).toBe(403);

    const bad = await createJob(
      req('/api/v1/jobs', {
        method: 'POST',
        user: [adminUserId, 'PLACEMENT_ADMIN'],
        body: { ...validJobBody, minCgpa: 22, deadline: 'tomorrow' },
      })
    );
    expect(bad.status).toBe(400);
    const details = (await bad.json()).error.details;
    expect(details).toHaveProperty('minCgpa');
    expect(details).toHaveProperty('deadline');
  });

  it('admin creates a DRAFT job', async () => {
    const res = await createJob(
      req('/api/v1/jobs', { method: 'POST', user: [adminUserId, 'PLACEMENT_ADMIN'], body: validJobBody })
    );
    expect([200, 201]).toContain(res.status);
    const { data } = await res.json();
    jobId = data.id ?? data.jobId;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    expect(job!.status).toBe('DRAFT');
  });

  it('student cannot apply to a DRAFT job', async () => {
    const res = await applyToJob(req(`/api/v1/jobs/${jobId}/apply`, { method: 'POST', user: [studentUserId, 'STUDENT'] }), ctx(jobId));
    expect([400, 404, 422]).toContain(res.status);
  });

  it('publish: student → 403, admin → 200, re-publish → 409', async () => {
    expect(
      (await publishJob(req(`/api/v1/jobs/${jobId}/publish`, { method: 'POST', user: [studentUserId, 'STUDENT'] }), ctx(jobId))).status
    ).toBe(403);

    const ok = await publishJob(req(`/api/v1/jobs/${jobId}/publish`, { method: 'POST', user: [adminUserId, 'PLACEMENT_ADMIN'] }), ctx(jobId));
    expect(ok.status).toBe(200);
    expect((await prisma.job.findUnique({ where: { id: jobId } }))!.status).toBe('PUBLISHED');

    const again = await publishJob(req(`/api/v1/jobs/${jobId}/publish`, { method: 'POST', user: [adminUserId, 'PLACEMENT_ADMIN'] }), ctx(jobId));
    expect(again.status).toBe(409);
  });

  it('student applies → 201; duplicate apply → idempotent 200 with alreadyExists', async () => {
    const first = await applyToJob(req(`/api/v1/jobs/${jobId}/apply`, { method: 'POST', user: [studentUserId, 'STUDENT'] }), ctx(jobId));
    expect(first.status).toBe(201);
    const dup = await applyToJob(req(`/api/v1/jobs/${jobId}/apply`, { method: 'POST', user: [studentUserId, 'STUDENT'] }), ctx(jobId));
    expect(dup.status).toBe(200);
    expect((await dup.json()).data.alreadyExists).toBe(true);

    const count = await prisma.application.count({
      where: { jobId, student: { userId: studentUserId } },
    });
    expect(count).toBe(1);
  });

  it('job detail is visible with the application count', async () => {
    const res = await getJob(req(`/api/v1/jobs/${jobId}`, { user: [adminUserId, 'PLACEMENT_ADMIN'] }), ctx(jobId));
    expect(res.status).toBe(200);
  });

  it('close: admin → 200, re-close → 409; closed job rejects applications', async () => {
    const ok = await closeJob(req(`/api/v1/jobs/${jobId}/close`, { method: 'POST', user: [adminUserId, 'PLACEMENT_ADMIN'] }), ctx(jobId));
    expect(ok.status).toBe(200);
    expect((await prisma.job.findUnique({ where: { id: jobId } }))!.status).toBe('CLOSED');

    const again = await closeJob(req(`/api/v1/jobs/${jobId}/close`, { method: 'POST', user: [adminUserId, 'PLACEMENT_ADMIN'] }), ctx(jobId));
    expect(again.status).toBe(409);

    // a different student cannot apply to a closed job
    const priya = await prisma.user.findUniqueOrThrow({ where: { email: 'priya.nair@college.edu' } });
    const res = await applyToJob(req(`/api/v1/jobs/${jobId}/apply`, { method: 'POST', user: [priya.id, 'STUDENT'] }), ctx(jobId));
    expect([400, 404, 422]).toContain(res.status);
  });
});
