import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/errors/api-error';
import { Prisma } from '@prisma/client';

// The exact shape listStudents returns (student + email + evidence + newest resume)
const studentListInclude = {
  user: { select: { email: true } },
  skillEvidence: {
    include: {
      skill: { select: { id: true, canonicalName: true, category: true } },
    },
  },
  resumeVersions: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.StudentInclude;

export type StudentListItem = Prisma.StudentGetPayload<{ include: typeof studentListInclude }>;

// ─── Helpers ─────────────────────────────────────────────────────

export async function getStudentByUserId(userId: string): Promise<{ id: string }> {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!student) throw new ApiError(404, 'NOT_FOUND', 'Student');
  return student;
}

/**
 * Recalculate profileCompleteness for a student.
 * Score is 100 when ALL of:
 *   - name is set (always true after creation, but check non-empty)
 *   - cgpa is not null
 *   - department is set
 *   - program is set
 *   - activeBacklogs is not null (default 0, so effectively always set)
 *   - at least 1 skill evidence row
 *   - at least 1 non-deleted resume version
 */
async function recalculateCompleteness(studentId: string): Promise<number> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      name: true,
      cgpa: true,
      department: true,
      program: true,
      activeBacklogs: true,
      skillEvidence: { select: { id: true }, take: 1 },
      resumeVersions: {
        where: { deletedAt: null },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!student) return 0;

  const hasName = Boolean(student.name?.trim());
  const hasCgpa = student.cgpa !== null;
  const hasDepartment = Boolean(student.department?.trim());
  const hasProgram = Boolean(student.program?.trim());
  const hasBacklogsField = student.activeBacklogs !== null;
  const hasSkill = student.skillEvidence.length > 0;
  const hasResume = student.resumeVersions.length > 0;

  const complete =
    hasName && hasCgpa && hasDepartment && hasProgram && hasBacklogsField && hasSkill && hasResume;

  return complete ? 100 : 0;
}

// ─── Service Functions ────────────────────────────────────────────

export async function getMyProfile(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: { email: true },
      },
      skillEvidence: {
        include: {
          skill: {
            select: {
              id: true,
              canonicalName: true,
              category: true,
            },
          },
        },
      },
      resumeVersions: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!student) throw new ApiError(404, 'NOT_FOUND', 'Student');
  return student;
}

export async function updateMyProfile(studentId: string, data: { name?: string }) {
  // Only name is student-editable; CGPA/backlogs/department managed by admin
  const updateData: { name?: string } = {};
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) throw new ApiError(400, 'BAD_REQUEST', 'Name cannot be empty');
    updateData.name = trimmed;
  }

  await prisma.student.update({
    where: { id: studentId },
    data: updateData,
  });

  // Recalculate and persist completeness
  const completeness = await recalculateCompleteness(studentId);
  const updated = await prisma.student.update({
    where: { id: studentId },
    data: { profileCompleteness: completeness },
    include: {
      user: { select: { email: true } },
      skillEvidence: {
        include: {
          skill: {
            select: { id: true, canonicalName: true, category: true },
          },
        },
      },
      resumeVersions: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return updated;
}

export async function addSkill(studentId: string, skillName: string) {
  const trimmedName = skillName.trim();
  if (!trimmedName) throw new ApiError(400, 'BAD_REQUEST', 'Skill name cannot be empty');

  // Find skill by canonicalName (case-insensitive) or create it
  let skill = await prisma.skill.findFirst({
    where: {
      canonicalName: { equals: trimmedName, mode: 'insensitive' },
    },
  });

  if (!skill) {
    skill = await prisma.skill.create({
      data: {
        canonicalName: trimmedName,
        category: 'Student Added',
      },
    });
  }

  // Check if already exists
  const existing = await prisma.studentSkillEvidence.findUnique({
    where: {
      studentId_skillId: { studentId, skillId: skill.id },
    },
  });

  if (existing) {
    throw new ApiError(409, 'CONFLICT', `Skill '${skill.canonicalName}' is already added`);
  }

  const evidence = await prisma.studentSkillEvidence.create({
    data: {
      studentId,
      skillId: skill.id,
      source: 'MANUAL',
      confidence: 80,
    },
    include: {
      skill: {
        select: { id: true, canonicalName: true, category: true },
      },
    },
  });

  // Recalculate completeness after adding a skill
  const completeness = await recalculateCompleteness(studentId);
  await prisma.student.update({
    where: { id: studentId },
    data: { profileCompleteness: completeness },
  });

  return evidence;
}

export async function removeSkill(studentId: string, skillId: string) {
  const evidence = await prisma.studentSkillEvidence.findUnique({
    where: {
      studentId_skillId: { studentId, skillId },
    },
  });

  if (!evidence) throw new ApiError(404, 'NOT_FOUND', 'Skill evidence');

  await prisma.studentSkillEvidence.delete({
    where: {
      studentId_skillId: { studentId, skillId },
    },
  });

  // Recalculate completeness — removing a skill may drop it below 100
  const completeness = await recalculateCompleteness(studentId);
  await prisma.student.update({
    where: { id: studentId },
    data: { profileCompleteness: completeness },
  });
}

export async function listSkills(studentId: string) {
  return prisma.studentSkillEvidence.findMany({
    where: { studentId },
    include: {
      skill: {
        select: {
          id: true,
          canonicalName: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

// ─── Pagination types ─────────────────────────────────────────────────────

export interface ListStudentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
}

export interface PaginatedStudents {
  items: StudentListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

/**
 * Get a single student by ID (PLACEMENT_ADMIN only)
 */
export async function getStudentById(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: { email: true },
      },
      skillEvidence: {
        include: {
          skill: {
            select: {
              id: true,
              canonicalName: true,
              category: true,
            },
          },
        },
      },
      resumeVersions: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!student) throw new ApiError(404, 'NOT_FOUND', 'Student');
  return student;
}

/**
 * List all students (PLACEMENT_ADMIN only)
 */
export async function listStudents(params: ListStudentsParams): Promise<PaginatedStudents> {
  const { page = 1, pageSize = 20, search, department } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.StudentWhereInput = {};
  
  if (department) {
    where.department = { contains: department, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { rollNumber: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: studentListInclude,
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    hasNext: skip + pageSize < total,
  };
}
