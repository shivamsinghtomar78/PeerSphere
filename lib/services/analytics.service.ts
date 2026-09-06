import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/errors/api-error';

export interface PlacementStats {
  totalStudents: number;
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
  offersExtended: number;
  offersAccepted: number;
  avgMatchScore: number | null;
  avgConfidence: number | null;
  placementRate: number;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
}

function getSkillPriority(count: number): 'high' | 'medium' | 'low' {
  if (count > 50) return 'high';
  if (count > 20) return 'medium';
  return 'low';
}

/**
 * Returns aggregate placement statistics for the current batch.
 */
export async function getPlacementStats(): Promise<PlacementStats> {
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
      // Include REVIEW_REQUIRED evaluations — scores are final from the engine;
      // status only reflects the admin approval workflow.
      where: { status: { in: ['COMPLETED', 'REVIEW_REQUIRED'] } },
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

  return {
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
  };
}

/**
 * Returns the top 10 skills most frequently MISSING in RequirementMatch records.
 */
export async function getSkillGaps(): Promise<{ totalStudents: number; skillGaps: SkillGap[] }> {
  // Group MISSING requirement matches by requirement — the engine writes
  // requirementMatch.skillId = null (the skill is reachable through the
  // requirement relation), so we resolve names via requirements.
  const missingMatches = await prisma.requirementMatch.groupBy({
    by: ['requirementId'],
    where: {
      matchState: 'MISSING',
    },
    _count: { requirementId: true },
    orderBy: { _count: { requirementId: 'desc' } },
    take: 10,
  });

  const requirementIds = missingMatches
    .map((m) => m.requirementId)
    .filter((id): id is string => id !== null);

  const requirements = await prisma.jobRequirement.findMany({
    where: { id: { in: requirementIds } },
    select: {
      id: true,
      label: true,
      skill: { select: { id: true, canonicalName: true } },
    },
  });

  const requirementById = new Map(requirements.map((r) => [r.id, r]));

  const totalStudents = await prisma.student.count();

  const skillGaps: SkillGap[] = missingMatches.flatMap((match) => {
    const requirement = requirementById.get(match.requirementId);
    if (!requirement) return [];
    const skillId = requirement.skill?.id ?? requirement.id;
    const skillName = requirement.skill?.canonicalName ?? requirement.label;
    const count = match._count.requirementId;
    return [
      {
        skillId,
        skillName,
        count,
        priority: getSkillPriority(count),
      },
    ];
  });

  return { totalStudents, skillGaps };
}

// Available reports metadata
export const AVAILABLE_REPORTS = [
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
