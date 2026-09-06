import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/middleware';
import * as studentsService from '@/lib/services/students.service';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '@/lib/api/response';
import { ApiError } from '@/lib/errors/api-error';

const addSkillSchema = z.object({
  skillName: z.string().trim().min(1, 'Skill name cannot be empty').max(255),
});

// ─── GET /students/me/skills ───────────────────────────────────────────
// Returns the authenticated student's verified skills.

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorizedError();
    if (user.role !== 'STUDENT') return forbiddenError();

    const student = await studentsService.getStudentByUserId(user.userId);
    const skills = await studentsService.listSkills(student.id);
    return successResponse(skills);
  } catch (error: any) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return notFoundError('Student profile');
    }
    console.error('[STUDENTS_ME_SKILLS_GET_ERROR]', error);
    return internalError();
  }
}

// ─── POST /students/me/skills ──────────────────────────────────────────
// Adds a skill to the authenticated student's profile.

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorizedError();
    if (user.role !== 'STUDENT') return forbiddenError();

    const body = await request.json();
    const parsed = addSkillSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestError('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const student = await studentsService.getStudentByUserId(user.userId);
    const evidence = await studentsService.addSkill(student.id, parsed.data.skillName);
    return successResponse(evidence);
  } catch (error: any) {
    if (error instanceof ApiError) {
      if (error.statusCode === 400) return badRequestError(error.message);
      if (error.statusCode === 404) return notFoundError('Student profile');
      if (error.statusCode === 409) return badRequestError(error.message);
    }
    console.error('[STUDENTS_ME_SKILLS_POST_ERROR]', error);
    return internalError();
  }
}