/**
 * Integration: student self-service — /students/me, /students/me/skills,
 * /students/me/resumes (+ download) against the seeded test DB.
 */
import { NextRequest } from 'next/server';
import { GET as getMe, PATCH as patchMe } from '@/app/api/v1/students/me/route';
import { GET as listSkills, POST as addSkill } from '@/app/api/v1/students/me/skills/route';
import { DELETE as removeSkill } from '@/app/api/v1/students/me/skills/[skillId]/route';
import { GET as listResumes, POST as uploadResume } from '@/app/api/v1/students/me/resumes/route';
import { GET as downloadResume } from '@/app/api/v1/students/me/resumes/[id]/download/route';
import { prisma } from '@/lib/db/prisma';

let studentUserId: string; // arjun
let otherStudentUserId: string; // priya
let adminUserId: string;

beforeAll(async () => {
  const users = await prisma.user.findMany({
    where: {
      email: { in: ['arjun.sharma@college.edu', 'priya.nair@college.edu', 'placement@college.edu'] },
    },
  });
  studentUserId = users.find((u) => u.email.startsWith('arjun'))!.id;
  otherStudentUserId = users.find((u) => u.email.startsWith('priya'))!.id;
  adminUserId = users.find((u) => u.email.startsWith('placement'))!.id;
});

afterAll(() => prisma.$disconnect());

function asUser(
  userId: string,
  role: 'STUDENT' | 'PLACEMENT_ADMIN',
  path: string,
  init: { method?: string; body?: BodyInit; contentType?: string } = {}
): NextRequest {
  const headers: Record<string, string> = { 'x-user-id': userId, 'x-user-role': role };
  if (init.contentType) headers['Content-Type'] = init.contentType;
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body,
  });
}

const jsonBody = (b: unknown) => ({ body: JSON.stringify(b), contentType: 'application/json' });

describe('GET/PATCH /students/me', () => {
  it('returns own profile including resumeVersions', async () => {
    const res = await getMe(asUser(studentUserId, 'STUDENT', '/api/v1/students/me'));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.name).toBe('Arjun Sharma');
    expect(data).toHaveProperty('resumeVersions');
    expect(data).toHaveProperty('profileCompleteness');
  });

  it('admin role on the student-only route → 403', async () => {
    const res = await getMe(asUser(adminUserId, 'PLACEMENT_ADMIN', '/api/v1/students/me'));
    expect(res.status).toBe(403);
  });

  it('PATCH updates name and persists', async () => {
    const res = await patchMe(
      asUser(studentUserId, 'STUDENT', '/api/v1/students/me', { method: 'PATCH', ...jsonBody({ name: 'Arjun S. Sharma' }) })
    );
    expect(res.status).toBe(200);
    const student = await prisma.student.findFirst({ where: { userId: studentUserId } });
    expect(student!.name).toBe('Arjun S. Sharma');
    // restore
    await patchMe(
      asUser(studentUserId, 'STUDENT', '/api/v1/students/me', { method: 'PATCH', ...jsonBody({ name: 'Arjun Sharma' }) })
    );
  });

  it('PATCH rejects empty name → 400 with field errors', async () => {
    const res = await patchMe(
      asUser(studentUserId, 'STUDENT', '/api/v1/students/me', { method: 'PATCH', ...jsonBody({ name: '' }) })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.details).toHaveProperty('name');
  });
});

describe('skills management', () => {
  it('lists seeded skills', async () => {
    const res = await listSkills(asUser(studentUserId, 'STUDENT', '/api/v1/students/me/skills'));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('add → appears in list; duplicate add → 409; remove → gone', async () => {
    // pick a taxonomy skill arjun does not have
    const student = await prisma.student.findFirst({ where: { userId: studentUserId } });
    const owned = await prisma.studentSkillEvidence.findMany({ where: { studentId: student!.id } });
    const fresh = await prisma.skill.findFirst({ where: { id: { notIn: owned.map((o) => o.skillId) } } });
    expect(fresh).not.toBeNull();

    const added = await addSkill(
      asUser(studentUserId, 'STUDENT', '/api/v1/students/me/skills', { method: 'POST', ...jsonBody({ skillName: fresh!.canonicalName }) })
    );
    expect(added.status).toBe(200);

    const dup = await addSkill(
      asUser(studentUserId, 'STUDENT', '/api/v1/students/me/skills', { method: 'POST', ...jsonBody({ skillName: fresh!.canonicalName }) })
    );
    expect(dup.status).toBe(409);

    const removed = await removeSkill(
      asUser(studentUserId, 'STUDENT', `/api/v1/students/me/skills/${fresh!.id}`, { method: 'DELETE' }),
      { params: Promise.resolve({ skillId: fresh!.id }) } as never
    );
    expect([200, 204]).toContain(removed.status);
    const after = await prisma.studentSkillEvidence.findFirst({
      where: { studentId: student!.id, skillId: fresh!.id },
    });
    expect(after).toBeNull();
  });
});

describe('resume upload / download / ownership', () => {
  function pdfFormData(name = 'resume.pdf', text = '%PDF-1.4 test resume content'): FormData {
    const bytes = new TextEncoder().encode(text);
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const fd = new FormData();
    fd.append('resume', new File([buffer], name, { type: 'application/pdf' }));
    return fd;
  }

  it('uploads a PDF, lists it, downloads it back intact', async () => {
    const fd = pdfFormData();
    const up = await uploadResume(
      asUser(studentUserId, 'STUDENT', '/api/v1/students/me/resumes', { method: 'POST', body: fd })
    );
    expect(up.status).toBe(201);
    const { data: uploaded } = await up.json();
    expect(uploaded.state).toBe('UPLOADED');
    expect(uploaded.mimeType).toBe('application/pdf');

    const list = await listResumes(asUser(studentUserId, 'STUDENT', '/api/v1/students/me/resumes'));
    const { data: resumes } = await list.json();
    expect(resumes.some((r: { id: string }) => r.id === uploaded.id)).toBe(true);

    const dl = await downloadResume(
      asUser(studentUserId, 'STUDENT', `/api/v1/students/me/resumes/${uploaded.id}/download`),
      { params: Promise.resolve({ id: uploaded.id }) } as never
    );
    expect(dl.status).toBe(200);
    const body = Buffer.from(await dl.arrayBuffer());
    expect(body.toString()).toContain('%PDF-1.4 test resume content');
  });

  it('rejects a non-PDF upload → 400', async () => {
    const fd = new FormData();
    fd.append('resume', new File(['MZ fake exe'], 'evil.exe', { type: 'application/x-msdownload' }));
    const res = await uploadResume(
      asUser(studentUserId, 'STUDENT', '/api/v1/students/me/resumes', { method: 'POST', body: fd })
    );
    expect(res.status).toBe(400);
  });

  it("student B cannot download student A's resume", async () => {
    const arjun = await prisma.student.findFirst({ where: { userId: studentUserId } });
    const resume = await prisma.resumeVersion.findFirst({ where: { studentId: arjun!.id } });
    expect(resume).not.toBeNull();

    const res = await downloadResume(
      asUser(otherStudentUserId, 'STUDENT', `/api/v1/students/me/resumes/${resume!.id}/download`),
      { params: Promise.resolve({ id: resume!.id }) } as never
    );
    expect([403, 404]).toContain(res.status);
  });
});
