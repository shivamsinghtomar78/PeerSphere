import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../types';
import * as overridesService from './overrides.service';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const createOverrideSchema = z.object({
  decision: z.string().min(1, 'decision is required'),
  reason: z.string().min(1, 'reason is required'),
});

const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /evaluations/:id/override
 * Creates a review override for an evaluation (PLACEMENT_ADMIN only).
 * Append-only: does NOT modify the evaluation record.
 */
router.post(
  '/evaluations/:id/override',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const evaluationId = req.params.id;
      const actorId = req.user!.userId;
      const { decision, reason } = createOverrideSchema.parse(req.body);

      const override = await overridesService.createOverride(
        evaluationId,
        actorId,
        decision,
        reason,
      );

      res.status(201).json({ success: true, data: override });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /evaluations/:id/overrides
 * Returns all overrides for an evaluation (PLACEMENT_ADMIN only).
 */
router.get(
  '/evaluations/:id/overrides',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const evaluationId = req.params.id;
      const overrides = await overridesService.listOverrides(evaluationId);
      res.json({ success: true, data: overrides });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /audit-log
 * Returns paginated audit events (PLACEMENT_ADMIN only).
 * Query params: page, pageSize, action, resourceType
 */
router.get(
  '/audit-log',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = auditLogQuerySchema.parse(req.query);
      const result = await overridesService.listAuditEvents(query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
