import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../types';
import { prisma } from '../../lib/prisma';

const router = Router();

// ─── Report metadata (static) ─────────────────────────────────────────────────

const AVAILABLE_REPORTS = [
  {
    id: 'placement-summary',
    title: 'Placement Summary Report',
    category: 'Placement',
    description:
      'High-level overview of placement statistics including offer rates, acceptance rates, and batch-wide metrics.',
    lastGenerated: '2026-08-15T18:00:00.000Z',
  },
  {
    id: 'skill-gap-analysis',
    title: 'Skill Gap Analysis Report',
    category: 'Skills',
    description:
      'Identifies skills most frequently missing across all students relative to active job requirements.',
    lastGenerated: '2026-08-15T18:00:00.000Z',
  },
  {
    id: 'department-wise-placement',
    title: 'Department-Wise Placement Report',
    category: 'Placement',
    description:
      'Breakdown of placement outcomes segmented by department and program.',
    lastGenerated: '2026-08-14T12:00:00.000Z',
  },
  {
    id: 'company-recruitment',
    title: 'Company Recruitment Report',
    category: 'Recruitment',
    description:
      "Tracks each company's hiring pipeline — applications received, shortlists, interviews, and offers.",
    lastGenerated: '2026-08-15T18:00:00.000Z',
  },
  {
    id: 'student-readiness',
    title: 'Student Readiness Report',
    category: 'Students',
    description:
      'Distribution of student placement-readiness and profile-completeness scores across the batch.',
    lastGenerated: '2026-08-13T09:00:00.000Z',
  },
  {
    id: 'evaluation-audit',
    title: 'Evaluation Audit Report',
    category: 'Compliance',
    description:
      'Full audit trail of AI evaluations and manual overrides for compliance and review purposes.',
    lastGenerated: '2026-08-15T06:00:00.000Z',
  },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSkillPriority(count: number): 'high' | 'medium' | 'low' {
  if (count > 50) return 'high';
  if (count > 20) return 'medium';
  return 'low';
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /analytics/skill-gaps
 * Returns the top 10 skills most frequently MISSING in RequirementMatch records.
 * Each entry includes: skillName, count, priority.
 * Also returns totalStudents.
 */
router.get(
  '/analytics/skill-gaps',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Group MISSING requirement matches by skill canonical name
      // Use raw groupBy via Prisma's groupBy on RequirementMatch joined with Skill
      const missingMatches = await prisma.requirementMatch.groupBy({
        by: ['skillId'],
        where: {
          matchState: 'MISSING',
          skillId: { not: null },
        },
        _count: { skillId: true },
        orderBy: { _count: { skillId: 'desc' } },
        take: 10,
      });

      // Resolve skill names from their IDs
      const skillIds = missingMatches
        .map((m) => m.skillId)
        .filter((id): id is string => id !== null);

      const skills = await prisma.skill.findMany({
        where: { id: { in: skillIds } },
        select: { id: true, canonicalName: true },
      });

      const skillNameById = new Map(skills.map((s) => [s.id, s.canonicalName]));

      const totalStudents = await prisma.student.count();

      const skillGaps = missingMatches.map((match) => {
        const count = match._count.skillId;
        return {
          skillId: match.skillId,
          skillName: skillNameById.get(match.skillId!) ?? 'Unknown',
          count,
          priority: getSkillPriority(count),
        };
      });

      res.json({
        success: true,
        data: {
          totalStudents,
          skillGaps,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /analytics/placement-stats
 * Returns aggregate placement statistics for the current batch.
 */
router.get(
  '/analytics/placement-stats',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [
        totalStudents,
        activeJobs,
        totalApplications,
        shortlisted,
        offersExtended,
        offersAccepted,
        scoreAggregates,
      ] = await Promise.all([
        prisma.student.count(),
        prisma.job.count({ where: { status: 'PUBLISHED' } }),
        prisma.application.count(),
        prisma.application.count({ where: { status: 'SHORTLISTED' } }),
        prisma.application.count({ where: { status: 'OFFER_EXTENDED' } }),
        prisma.application.count({ where: { status: 'OFFER_ACCEPTED' } }),
        prisma.evaluation.aggregate({
          where: { status: 'COMPLETED' },
          _avg: {
            overallScore: true,
            confidenceScore: true,
          },
        }),
      ]);

      // Placement rate = students with at least one accepted offer / total students
      const studentsWithOffers = await prisma.application.groupBy({
        by: ['studentId'],
        where: { status: 'OFFER_ACCEPTED' },
      });
      const placedStudentCount = studentsWithOffers.length;
      const placementRate =
        totalStudents > 0
          ? Math.round((placedStudentCount / totalStudents) * 10000) / 100
          : 0;

      res.json({
        success: true,
        data: {
          totalStudents,
          activeJobs,
          totalApplications,
          shortlisted,
          offersExtended,
          offersAccepted,
          avgMatchScore:
            scoreAggregates._avg.overallScore !== null
              ? Math.round((scoreAggregates._avg.overallScore ?? 0) * 100) / 100
              : null,
          avgConfidence:
            scoreAggregates._avg.confidenceScore !== null
              ? Math.round((scoreAggregates._avg.confidenceScore ?? 0) * 100) / 100
              : null,
          placementRate,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /reports
 * Returns the static list of available report types with metadata.
 * No actual PDF generation.
 */
router.get(
  '/reports',
  authenticate,
  requireRole('PLACEMENT_ADMIN'),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.json({
        success: true,
        data: {
          reports: AVAILABLE_REPORTS,
          total: AVAILABLE_REPORTS.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
