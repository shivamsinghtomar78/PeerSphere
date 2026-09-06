/**
 * Integration: application listing + status-transition state machine
 * (PATCH /applications/[id]) against the seeded test DB.
 * Creates its own job + application so seed data stays intact.
 */
import { NextRequest } from 'next/server';
import { GET as listApplications } from '@/app/api/v1/applications/route';
import { GET as getApplication, PATCH as patchApplication } from '@/app/api/v1/applications/[id]/route';
import { POST as createJob } from '@/app/api/v1/jobs/route';
import { POST as publishJob } from '@/app/api/v1/jobs/[jobId]/publish/route';
import { POST as applyToJob } from '@/app/api/v1/jobs/[jobId]/apply/route';
import { prisma } from '@/lib/db/prisma';

let adminUserId: string;
let studentUserId: string; // arjun (owner)
let otherStudentUserId: string; // priya
let applicationId: string;

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

const jobCtx = (jobId: string) => ({ params: Promise.resolve({ jobId }) }) as never;
const appCtx = (id: string) => ({ params: Promise.resolve({ id }) }) as never;

const patchStatus = (id: string, user: [string, 'STUDENT' | 'PLACEMENT_ADMIN'], status: string) =>
  patchApplication(req(`/api/v1/applications/${id}`, { method: 'PATCH', user, body: { status } }), appCtx(id));

beforeAll(async () => {
  adminUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'placement@college.edu' } })).id;
  studentUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'arjun.sharma@college.edu' } })).id;
  otherStudentUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'priya.nair@college.edu' } })).id;

  // fresh job + application owned by arjun
  const created = await createJob(
    req('/api/v1/jobs', {
      method: 'POST',
      user: [adminUserId, 'PLACEMENT_ADMIN'],
      body: {
        title: `Transitions Test Role ${Date.now()}`,
        company: 'TestCorp',
        location: 'Remote',
        workMode: 'REMOTE',
        jobType: 'FULL_TIME',
        description: 'transition-suite job',
        deadline: new Date(Date.now() + 30 * 86400_000).toISOString(),
        maxBacklogs: 5,
        allowedDepartments: ['Computer Science'],
        allowedPrograms: ['B.Tech'],
        requiredSkills: ['Java'],
        preferredSkills: [],
      },
    })
  );
  const jobId = (await created.json()).data.id;
  await publishJob(req(`/api/v1/jobs/${jobId}/publish`, { method: 'POST', user: [adminUserId, 'PLACEMENT_ADMIN'] }), jobCtx(jobId));
  const applied = await applyToJob(req(`/api/v1/jobs/${jobId}/apply`, { method: 'POST', user: [studentUserId, 'STUDENT'] }), jobCtx(jobId));
  applicationId = (await applied.json()).data.application.id;
});

afterAll(() => prisma.$disconnect());

describe('GET /applications + detail ownership', () => {
  it('admin lists all; student is forbidden on the collection', async () => {
    const admin = await listApplications(req('/api/v1/applications', { user: [adminUserId, 'PLACEMENT_ADMIN'] }));
    expect(admin.status).toBe(200);
    const student = await listApplications(req('/api/v1/applications', { user: [studentUserId, 'STUDENT'] }));
    expect(student.status).toBe(403);
  });

  it('owner sees their application detail; another student gets 403 (ownership fix)', async () => {
    const owner = await getApplication(req(`/api/v1/applications/${applicationId}`, { user: [studentUserId, 'STUDENT'] }), appCtx(applicationId));
    expect(owner.status).toBe(200);

    const stranger = await getApplication(req(`/api/v1/applications/${applicationId}`, { user: [otherStudentUserId, 'STUDENT'] }), appCtx(applicationId));
    expect(stranger.status).toBe(403);
  });
});

describe('status transitions (state machine)', () => {
  it('illegal jump APPLIED → OFFER_ACCEPTED → 409', async () => {
    expect((await patchStatus(applicationId, [adminUserId, 'PLACEMENT_ADMIN'], 'OFFER_ACCEPTED')).status).toBe(409);
  });

  it('student cannot shortlist their own application → 403', async () => {
    expect((await patchStatus(applicationId, [studentUserId, 'STUDENT'], 'SHORTLISTED')).status).toBe(403);
  });

  it('stranger student cannot withdraw someone else’s application → 403', async () => {
    expect((await patchStatus(applicationId, [otherStudentUserId, 'STUDENT'], 'WITHDRAWN')).status).toBe(403);
  });

  it('admin walks the legal chain, each step audited', async () => {
    const auditBefore = await prisma.auditEvent.count({ where: { action: 'APPLICATION_STATUS_CHANGED' } });

    for (const status of ['UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED'] as const) {
      const res = await patchStatus(applicationId, [adminUserId, 'PLACEMENT_ADMIN'], status);
      expect(res.status).toBe(200);
    }

    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    expect(app!.status).toBe('OFFER_EXTENDED');

    const auditAfter = await prisma.auditEvent.count({ where: { action: 'APPLICATION_STATUS_CHANGED' } });
    expect(auditAfter).toBe(auditBefore + 4);
  });

  it('owner withdraws from OFFER_EXTENDED → 200; terminal state accepts nothing after', async () => {
    const res = await patchStatus(applicationId, [studentUserId, 'STUDENT'], 'WITHDRAWN');
    expect(res.status).toBe(200);
    expect((await prisma.application.findUnique({ where: { id: applicationId } }))!.status).toBe('WITHDRAWN');

    // WITHDRAWN is terminal — even admin cannot move it
    expect((await patchStatus(applicationId, [adminUserId, 'PLACEMENT_ADMIN'], 'UNDER_REVIEW')).status).toBe(409);
  });

  it('empty PATCH body → 400', async () => {
    const res = await patchApplication(
      req(`/api/v1/applications/${applicationId}`, { method: 'PATCH', user: [adminUserId, 'PLACEMENT_ADMIN'], body: {} }),
      appCtx(applicationId)
    );
    expect(res.status).toBe(400);
  });
});
