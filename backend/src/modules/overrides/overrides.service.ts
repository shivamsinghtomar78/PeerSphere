import { prisma } from '../../lib/prisma';
import { ApiError } from '../../errors/ApiError';

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Creates a review override for an evaluation (append-only — never mutates the
 * evaluation record itself). Writes an AuditEvent for traceability.
 */
export async function createOverride(
  evaluationId: string,
  actorId: string,
  decision: string,
  reason: string,
) {
  // Verify the evaluation exists
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
  });
  if (!evaluation) throw ApiError.notFound('Evaluation');

  // Validate decision value
  const validDecisions = ['shortlist', 'reject', 'review', 'promote'];
  if (!validDecisions.includes(decision.toLowerCase())) {
    throw ApiError.badRequest(
      `Invalid decision "${decision}". Must be one of: ${validDecisions.join(', ')}`,
    );
  }

  // Create the override and audit event in a single transaction
  const [override] = await prisma.$transaction([
    prisma.reviewOverride.create({
      data: {
        evaluationId,
        actorId,
        decision: decision.toLowerCase(),
        reason,
      },
      include: {
        actor: {
          select: { id: true, email: true, role: true },
        },
      },
    }),
    prisma.auditEvent.create({
      data: {
        actorId,
        action: 'EVALUATION_OVERRIDE',
        resourceType: 'Evaluation',
        resourceId: evaluationId,
        metadata: {
          decision: decision.toLowerCase(),
          reason,
        },
      },
    }),
  ]);

  return override;
}

/**
 * Returns all overrides for an evaluation ordered by createdAt descending.
 */
export async function listOverrides(evaluationId: string) {
  // Verify the evaluation exists first
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: { id: true },
  });
  if (!evaluation) throw ApiError.notFound('Evaluation');

  const overrides = await prisma.reviewOverride.findMany({
    where: { evaluationId },
    orderBy: { createdAt: 'desc' },
    include: {
      actor: {
        select: { id: true, email: true, role: true },
      },
    },
  });

  return overrides;
}

// ─── Audit log ────────────────────────────────────────────────────────────────

/**
 * Returns paginated audit events with optional filters.
 */
export async function listAuditEvents(query: {
  page?: number;
  pageSize?: number;
  action?: string;
  resourceType?: string;
}) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: { action?: string; resourceType?: string } = {};
  if (query.action) where.action = query.action;
  if (query.resourceType) where.resourceType = query.resourceType;

  const [total, events] = await Promise.all([
    prisma.auditEvent.count({ where }),
    prisma.auditEvent.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, email: true, role: true },
        },
      },
    }),
  ]);

  return {
    items: events,
    total,
    page,
    pageSize,
    hasNext: skip + pageSize < total,
  };
}
