import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../types';
import { ApiError } from '../../errors/ApiError';
import {
  getMyProfile,
  updateMyProfile,
  addSkill,
  removeSkill,
  listSkills,
  listStudents,
  getStudentByUserId,
  getStudentById,
} from './students.service';

export { getStudentByUserId, getStudentById };

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').trim().optional(),
});

const addSkillSchema = z.object({
  skillName: z.string().min(1, 'skillName is required').trim(),
});

// ─── Routes ──────────────────────────────────────────────────────

/**
 * GET /me
 * Returns the authenticated student's full profile.
 */
router.get(
  '/me',
  authenticate,
  requireRole('STUDENT'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id: studentId } = await getStudentByUserId(req.user!.userId);
      const data = await getMyProfile(studentId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /me
 * Update mutable student fields (name only — CGPA/dept/backlogs are admin-managed).
 */
router.patch(
  '/me',
  authenticate,
  requireRole('STUDENT'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(ApiError.badRequest('Validation failed', parsed.error.flatten()));
      }

      const { id: studentId } = await getStudentByUserId(req.user!.userId);
      const data = await updateMyProfile(studentId, parsed.data);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /me/skills
 * List all skills for the authenticated student.
 */
router.get(
  '/me/skills',
  authenticate,
  requireRole('STUDENT'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id: studentId } = await getStudentByUserId(req.user!.userId);
      const data = await listSkills(studentId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /me/skills
 * Add a skill to the authenticated student's profile.
 * Body: { skillName: string }
 */
router.post(
  '/me/skills',
  authenticate,
  requireRole('STUDENT'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = addSkillSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(ApiError.badRequest('Validation failed', parsed.error.flatten()));
      }

      const { id: studentId } = await getStudentByUserId(req.user!.userId);
      const data = await addSkill(studentId, parsed.data.skillName);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /me/skills/:skillId
 * Remove a skill from the authenticated student's profile.
 */
router.delete(
  '/me/skills/:skillId',
  authenticate,
  requireRole('STUDENT'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { skillId } = req.params;
      const { id: studentId } = await getStudentByUserId(req.user!.userId);
      await removeSkill(studentId, skillId);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Validation schemas for list ─────────────────────────────────────────

const listStudentsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
});

// ─── GET /students (PLACEMENT_ADMIN only) ─────────────────────────────────

/**
 * GET /students
 * List all students with pagination and filtering.
 */
router.get(
  '/',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = listStudentsSchema.parse(req.query);
      const data = await listStudents(query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /students/:id (PLACEMENT_ADMIN only) ───────────────────────────────

/**
 * GET /students/:id
 * Get a single student by ID.
 */
router.get(
  '/:id',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await getStudentById(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
