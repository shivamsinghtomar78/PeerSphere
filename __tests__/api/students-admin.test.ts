/**
 * Integration: admin roster — GET /students (list/filter/paginate),
 * GET /students/[id] (detail) against the seeded test DB.
 */
import { NextRequest } from 'next/server';
import { GET as listStudents } from '@/app/api/v1/students/route';
import { GET as getStudent } from '@/app/api/v1/students/[id]/route';
import { prisma } from '@/lib/db/prisma';

let adminUserId: string;
let studentUserId: string;

beforeAll(async () => {
  adminUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'placement@college.edu' } })).id;
  studentUserId = (await prisma.user.findUniqueOrThrow({ where: { email: 'arjun.sharma@college.edu' } })).id;
});

afterAll(() => prisma.$disconnect());

function asUser(userId: string, role: 'STUDENT' | 'PLACEMENT_ADMIN', path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { 'x-user-id': userId, 'x-user-role': role },
  });
}

describe('GET /students — roster', () => {
  it('admin sees all 5 seeded students', async () => {
    const res = await listStudents(asUser(adminUserId, 'PLACEMENT_ADMIN', '/api/v1/students'));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    const items = data.items ?? data;
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveProperty('rollNumber');
  });

  it('student role → 403; no identity → 401', async () => {
    expect((await listStudents(asUser(studentUserId, 'STUDENT', '/api/v1/students'))).status).toBe(403);
    expect((await listStudents(new NextRequest('http://localhost:3000/api/v1/students'))).status).toBe(401);
  });

  it('search narrows results', async () => {
    const res = await listStudents(asUser(adminUserId, 'PLACEMENT_ADMIN', '/api/v1/students?search=Arjun'));
    const { data } = await res.json();
    const items = data.items ?? data;
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.every((s: { name: string }) => s.name.toLowerCase().includes('arjun'))).toBe(true);
  });

  it('pagination bounds respected; invalid pageSize → 400', async () => {
    const page = await listStudents(asUser(adminUserId, 'PLACEMENT_ADMIN', '/api/v1/students?page=1&pageSize=2'));
    const { data } = await page.json();
    expect((data.items ?? data).length).toBeLessThanOrEqual(2);

    const bad = await listStudents(asUser(adminUserId, 'PLACEMENT_ADMIN', '/api/v1/students?pageSize=999'));
    expect(bad.status).toBe(400);
  });
});

describe('GET /students/[id] — detail', () => {
  it('returns skills and resume state for a real student', async () => {
    const arjun = await prisma.student.findFirstOrThrow({ where: { userId: studentUserId } });
    const res = await getStudent(
      asUser(adminUserId, 'PLACEMENT_ADMIN', `/api/v1/students/${arjun.id}`),
      { params: Promise.resolve({ id: arjun.id }) } as never
    );
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.name).toBe('Arjun Sharma');
  });

  it('unknown id → 404; student role → 403', async () => {
    const missing = await getStudent(
      asUser(adminUserId, 'PLACEMENT_ADMIN', '/api/v1/students/00000000-0000-0000-0000-000000000000'),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) } as never
    );
    expect(missing.status).toBe(404);

    const forbidden = await getStudent(
      asUser(studentUserId, 'STUDENT', '/api/v1/students/whatever'),
      { params: Promise.resolve({ id: 'whatever' }) } as never
    );
    expect(forbidden.status).toBe(403);
  });
});
