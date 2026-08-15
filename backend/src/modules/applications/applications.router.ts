import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../types';
import * as applicationsService from './applications.service';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const updateStatusSchema = z.object({
  status: z.string().min(1),
  notes: z.string().optional(),
});

const listJobApplicationsQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /jobs/:jobId/apply
 * Student applies to a published job.
 */
router.post(
  '/jobs/:jobId/apply',
  authenticate,
  requireRole('STUDENT'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.userId;
      const { jobId } = req.params;

      // Resolve studentId from the user's student record
      const { prisma } = await import('../../lib/prisma');
      const student = await prisma.student.findUnique({
        where: { userId: studentId },
        select: { id: true },
      });
      if (!student) {
        const { ApiError } = await import('../../errors/ApiError');
        return next(ApiError.notFound('Student profile'));
      }

      const result = await applicationsService.applyToJob(student.id, jobId);

      const statusCode = result.alreadyExists ? 200 : 201;
      res.status(statusCode).json({
        success: true,
        data: {
          application: result.application,
          alreadyExists: result.alreadyExists,
          ...(result.alreadyExists && {
            note: 'You have already applied to this job.',
          }),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /students/me/applications
 * Returns the authenticated student's applications.
 */
router.get(
  '/students/me/applications',
  authenticate,
  requireRole('STUDENT'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const { prisma } = await import('../../lib/prisma');
      const student = await prisma.student.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!student) {
        const { ApiError } = await import('../../errors/ApiError');
        return next(ApiError.notFound('Student profile'));
      }

      const applications = await applicationsService.listMyApplications(student.id);
      res.json({ success: true, data: applications });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /jobs/:jobId/applications
 * Returns paginated applications for a job (PLACEMENT_ADMIN only).
 */
router.get(
  '/jobs/:jobId/applications',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { jobId } = req.params;
      const query = listJobApplicationsQuerySchema.parse(req.query);

      const result = await applicationsService.listJobApplications(jobId, query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /applications/:id/status
 * Updates the status of an application (PLACEMENT_ADMIN only).
 */
router.patch(
  '/applications/:id/status',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, notes } = updateStatusSchema.parse(req.body);
      const actorId = req.user!.userId;

      const application = await applicationsService.updateApplicationStatus(
        id,
        status,
        actorId,
        notes,
      );
      res.json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
