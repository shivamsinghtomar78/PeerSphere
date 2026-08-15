import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../types';
import { ApiError } from '../../errors/ApiError';
import * as evaluationsService from './evaluations.service';
import { getStudentByUserId } from '../students/students.router';

const router = Router();

// ─── POST /jobs/:jobId/evaluations ───────────────────────────────────────────
// STUDENT: queues an evaluation for themselves
// PLACEMENT_ADMIN: queues an evaluation for any student via body.studentId

const queueBodySchema = z.object({
  studentId: z.string().uuid().optional(),
});

router.post(
  '/jobs/:jobId/evaluations',
  authenticate,
  requireRole('STUDENT', 'PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { jobId } = req.params;
      const body = queueBodySchema.parse(req.body);

      let studentId: string;

      if (req.user!.role === 'STUDENT') {
        // Students always queue for themselves — ignore body.studentId
        const student = await getStudentByUserId(req.user!.userId);
        if (!student) throw ApiError.notFound('Student profile');
        studentId = student.id;
      } else {
        // PLACEMENT_ADMIN must provide a studentId
        if (!body.studentId) {
          throw ApiError.badRequest('studentId is required for PLACEMENT_ADMIN');
        }
        studentId = body.studentId;
      }

      const evaluation = await evaluationsService.queueEvaluation(studentId, jobId);
      res.status(201).json({ success: true, data: evaluation });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /jobs/:jobId/evaluations ────────────────────────────────────────────
// PLACEMENT_ADMIN only — list all evaluations for a job's latest version

router.get(
  '/jobs/:jobId/evaluations',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { jobId } = req.params;
      const evaluations = await evaluationsService.listJobEvaluations(jobId);
      res.json({ success: true, data: evaluations });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /students/me/evaluations ────────────────────────────────────────────
// STUDENT only — list all evaluations for the authenticated student

router.get(
  '/students/me/evaluations',
  authenticate,
  requireRole('STUDENT'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const student = await getStudentByUserId(req.user!.userId);
      if (!student) throw ApiError.notFound('Student profile');

      const evaluations = await evaluationsService.listStudentEvaluations(student.id);
      res.json({ success: true, data: evaluations });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /evaluations/:id ────────────────────────────────────────────────────
// Authenticated — STUDENT sees own, PLACEMENT_ADMIN sees all

router.get(
  '/evaluations/:id',
  authenticate,
  requireRole('STUDENT', 'PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const evaluation = await evaluationsService.getEvaluation(
        id,
        req.user!.userId,
        req.user!.role,
      );
      res.json({ success: true, data: evaluation });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
