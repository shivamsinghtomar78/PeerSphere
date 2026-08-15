import { Router, Response, NextFunction, Request } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../types';
import * as jobsService from './jobs.service';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────

const listJobsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).optional(),
  department: z.string().trim().optional(),
});

const createJobSchema = z.object({
  title: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  location: z.string().min(1).max(255),
  workMode: z.enum(['ONSITE', 'REMOTE', 'HYBRID']),
  jobType: z.enum(['FULL_TIME', 'INTERNSHIP', 'CONTRACT']),
  salary: z.string().max(100).optional(),
  description: z.string().min(1),
  deadline: z.string().datetime({ message: 'deadline must be an ISO 8601 datetime string' }),
  minCgpa: z.number().min(0).max(10).optional(),
  maxBacklogs: z.number().int().min(0),
  allowedDepartments: z.array(z.string().min(1)).min(1),
  allowedPrograms: z.array(z.string().min(1)).min(1),
  requiredSkills: z.array(z.string().min(1)).default([]),
  preferredSkills: z.array(z.string().min(1)).default([]),
});

const updateJobSchema = createJobSchema.partial();

const jobIdSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

// ─── Routes ───────────────────────────────────────────────────────

// GET /jobs — list jobs (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listJobsSchema.parse(req.query);
    const data = await jobsService.listJobs(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /jobs/:id — get a single job (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = jobIdSchema.parse(req.params);
    const data = await jobsService.getJob(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /jobs — create job (PLACEMENT_ADMIN only)
router.post(
  '/',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = createJobSchema.parse(req.body);
      const data = await jobsService.createJob(req.user!.userId, dto);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /jobs/:id — update job (PLACEMENT_ADMIN only)
router.patch(
  '/:id',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = jobIdSchema.parse(req.params);
      const dto = updateJobSchema.parse(req.body);
      const data = await jobsService.updateJob(id, dto);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// POST /jobs/:id/publish — publish job (PLACEMENT_ADMIN only)
router.post(
  '/:id/publish',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = jobIdSchema.parse(req.params);
      const data = await jobsService.publishJob(id, req.user!.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// POST /jobs/:id/close — close job (PLACEMENT_ADMIN only)
router.post(
  '/:id/close',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = jobIdSchema.parse(req.params);
      const data = await jobsService.closeJob(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
