import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/errors/api-error';
import { EvaluationStatus } from '@prisma/client';
import { computeMatch, StudentSkillInput, JobSkillRequirement } from '@/lib/engines/matching.engine';
import { checkEligibility as checkEligibilityEngine } from '@/lib/engines/eligibility.engine';
import { analyzeSkillGaps } from '@/lib/engines/skillgap.engine';

export async function queueEvaluation(studentId: string, jobId: string) {
  // 1. Get latest published JobVersion
  const jobVersion = await prisma.jobVersion.findFirst({
    where: { jobId, job: { status: 'PUBLISHED' }, publishedAt: { not: null } },
    orderBy: { version: 'desc' },
    include: { requirements: { include: { skill: true } } },
  });
  if (!jobVersion) throw new ApiError(404, 'NOT_FOUND', 'Published job for this drive');

  // 2. Get student with skills
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { skillEvidence: { include: { skill: true } } },
  });
  if (!student) throw new ApiError(404, 'NOT_FOUND', 'Student');

  // 3. Build typed inputs for engines
  const studentSkillInputs: StudentSkillInput[] = student.skillEvidence.map((e) => ({
    name: e.skill.canonicalName,
    confidence: e.confidence,
  }));

  const jobSkillRequirements: JobSkillRequirement[] = jobVersion.requirements.map((r) => ({
    id: r.id,
    name: r.skill?.canonicalName ?? r.label,
    aliases: r.skill?.aliases ?? [],
    weight: r.weight,
    required: r.required,
  }));

  // 4. Build snapshot and hash (idempotency — hash excludes the timestamp so
  // re-running with identical inputs returns the existing evaluation)
  const snapshotAt = new Date().toISOString();
  const inputSnapshot = {
    studentId,
    jobVersionId: jobVersion.id,
    studentSkills: studentSkillInputs,
    jobRequirements: jobSkillRequirements.map((r) => ({
      id: r.id, name: r.name, weight: r.weight, required: r.required,
    })),
    snapshotAt,
  };
  const hashBase = { ...inputSnapshot, snapshotAt: undefined };
  const snapshotHash = crypto.createHash('sha256').update(JSON.stringify(hashBase)).digest('hex');

  // 5. Idempotency check
  const existing = await prisma.evaluation.findFirst({
    where: { snapshotHash },
    include: {
      requirementMatches: { include: { skill: true, requirement: true } },
      recommendations: true,
    },
  });
  if (existing) return existing;

  // 6. Create Evaluation
  const evaluation = await prisma.evaluation.create({
    data: {
      studentId,
      jobVersionId: jobVersion.id,
      inputSnapshot: inputSnapshot as unknown as Parameters<typeof prisma.evaluation.create>[0]['data']['inputSnapshot'],
      snapshotHash,
      status: 'QUEUED',
      eligibility: 'PENDING',
    },
  });

  // 7a. Eligibility
  const eligResult = checkEligibilityEngine({
    studentCgpa: student.cgpa ? Number(student.cgpa) : null,
    studentActiveBacklogs: student.activeBacklogs,
    studentDepartment: student.department,
    studentProgram: student.program,
    minCgpa: jobVersion.minCgpa ? Number(jobVersion.minCgpa) : null,
    maxBacklogs: jobVersion.maxBacklogs,
    allowedDepartments: jobVersion.allowedDepartments,
    allowedPrograms: jobVersion.allowedPrograms,
  });

  // 7b. Match
  const matchResult = computeMatch(studentSkillInputs, jobSkillRequirements);

  // 7c. Gaps
  const gapResults = analyzeSkillGaps({
    studentSkills: studentSkillInputs,
    jobRequirements: jobSkillRequirements,
    matchDetails: matchResult.details,
  });

  const requiresReview = eligResult.status === 'CONDITIONAL' || matchResult.requiresReview;

  // 7d. Update evaluation
  await prisma.evaluation.update({
    where: { id: evaluation.id },
    data: {
      eligibility: eligResult.status,
      overallScore: Math.round(matchResult.overallScore),
      confidenceScore: Math.round(matchResult.confidenceScore),
      coveragePercent: Math.round(matchResult.coveragePercent),
      matchSummary: matchResult.matchSummary,
      requiresReview,
      reviewNote: matchResult.reviewNote ?? (eligResult.failedRules.length > 0 ? eligResult.failedRules.join('; ') : null),
      status: requiresReview ? 'REVIEW_REQUIRED' : 'COMPLETED',
    },
  });

  // 7e. Requirement matches
  if (matchResult.details.length > 0) {
    const skillIdByRequirementId = new Map(
      jobVersion.requirements.map((r) => [r.id, r.skillId])
    );
    await prisma.requirementMatch.createMany({
      data: matchResult.details.map((d) => ({
        evaluationId: evaluation.id,
        requirementId: d.requirementId,
        skillId: skillIdByRequirementId.get(d.requirementId) ?? null,
        matchState: d.status,
        contribution: d.contribution,
        explanation: d.explanation,
      })),
    });
  }

  // 7f. Recommendations
  if (gapResults.length > 0) {
    await prisma.recommendation.createMany({
      data: gapResults.map((r) => ({
        evaluationId: evaluation.id,
        skillName: r.skillName,
        priority: r.priority,
        reason: r.reason,
        steps: r.steps,
        potentialLift: r.potentialLift ?? null,
        estimatedWeeks: r.estimatedWeeks ?? null,
      })),
    });
  }

  // 8. Return completed
  return prisma.evaluation.findUniqueOrThrow({
    where: { id: evaluation.id },
    include: {
      requirementMatches: { include: { skill: true, requirement: true } },
      recommendations: true,
    },
  });
}

export async function getEvaluation(evaluationId: string, requestingUserId: string, requestingRole: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      requirementMatches: { include: { skill: true, requirement: true } },
      recommendations: true,
      student: { select: { id: true, userId: true, name: true, rollNumber: true } },
      jobVersion: { select: { id: true, title: true, company: true, version: true } },
    },
  });
  if (!evaluation) throw new ApiError(404, 'NOT_FOUND', 'Evaluation');
  if (requestingRole === 'STUDENT' && evaluation.student.userId !== requestingUserId) {
    throw new ApiError(403, 'FORBIDDEN', 'You can only view your own evaluations');
  }
  return evaluation;
}

export async function listStudentEvaluations(studentId: string) {
  const [total, evaluations] = await Promise.all([
    prisma.evaluation.count({ where: { studentId } }),
    prisma.evaluation.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, rollNumber: true } },
        jobVersion: {
          select: {
            id: true,
            title: true,
            company: true,
            version: true,
            jobId: true,
          },
        },
        requirementMatches: {
          include: {
            skill: true,
            requirement: true,
          },
        },
        recommendations: true,
      },
    }),
  ]);

  return {
    items: evaluations,
    total,
    page: 1,
    pageSize: Math.max(1, evaluations.length),
    hasNext: false,
  };
}

export async function listJobEvaluations(jobId: string) {
  const latestVersion = await prisma.jobVersion.findFirst({
    where: { jobId, publishedAt: { not: null } },
    orderBy: { version: 'desc' },
  });
  if (!latestVersion) throw new ApiError(404, 'NOT_FOUND', 'Published job version');

  return prisma.evaluation.findMany({
    where: { jobVersionId: latestVersion.id },
    orderBy: { overallScore: 'desc' },
    include: {
      student: { select: { id: true, name: true, rollNumber: true, cgpa: true, department: true, program: true } },
      jobVersion: { select: { id: true, title: true, company: true, version: true, jobId: true } },
      requirementMatches: {
        include: {
          skill: true,
          requirement: true,
        },
      },
      recommendations: true,
    },
  });
}

/**
 * Returns ALL paginated evaluations for PLACEMENT_ADMIN with full details.
 */
export async function listAllEvaluations(
  query: { status?: string; page?: number; pageSize?: number },
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: {
    status?: EvaluationStatus;
  } = {};

  if (query.status) {
    if (query.status in EvaluationStatus) {
      where.status = query.status as EvaluationStatus;
    } else {
      throw new ApiError(400, 'BAD_REQUEST', `Invalid status filter: ${query.status}`);
    }
  }

  const [total, evaluations] = await Promise.all([
    prisma.evaluation.count({ where }),
    prisma.evaluation.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            department: true,
            program: true,
            cgpa: true,
          },
        },
        jobVersion: {
          select: {
            id: true,
            title: true,
            company: true,
            version: true,
            jobId: true,
          },
        },
        requirementMatches: {
          include: {
            skill: true,
            requirement: true,
          },
        },
        recommendations: true,
      },
    }),
  ]);

  return {
    items: evaluations,
    total,
    page,
    pageSize,
    hasNext: skip + pageSize < total,
  };
}

// ─── Additional helper functions for API routes ───────────────────────────────

/**
 * Update evaluation.
 * `score` adjusts the overall score; `decision` may flag an evaluation
 * for review (shortlist/reject are application-level decisions).
 */
export async function updateEvaluation(
  evaluationId: string,
  data: { score?: number; decision?: 'shortlist' | 'reject' | 'review' },
  actorId: string
) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
  });
  if (!evaluation) throw new ApiError(404, 'NOT_FOUND', 'Evaluation');

  const updateData: {
    overallScore?: number;
    status?: EvaluationStatus;
    requiresReview?: boolean;
    reviewNote?: string;
  } = {};

  if (data.score !== undefined) {
    updateData.overallScore = Math.round(data.score);
  }
  if (data.decision !== undefined) {
    if (data.decision === 'review') {
      updateData.status = EvaluationStatus.REVIEW_REQUIRED;
      updateData.requiresReview = true;
      updateData.reviewNote = 'Flagged for manual review by placement admin';
    }
  }

  const updated = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: updateData,
  });

  await prisma.auditEvent.create({
    data: {
      actorId,
      action: 'EVALUATION_UPDATED',
      resourceType: 'Evaluation',
      resourceId: evaluationId,
      metadata: { score: data.score ?? null, decision: data.decision ?? null },
    },
  });

  return updated;
}

/**
 * Get evaluation by ID (simpler version without permission check)
 */
export async function getEvaluationById(id: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: {
      requirementMatches: { include: { skill: true, requirement: true } },
      recommendations: true,
      student: { select: { id: true, userId: true, name: true, rollNumber: true } },
      jobVersion: { select: { id: true, title: true, company: true, version: true } },
    },
  });
  if (!evaluation) throw new ApiError(404, 'NOT_FOUND', 'Evaluation');
  return evaluation;
}

/**
 * List evaluations by job (alias)
 */
export async function listEvaluationsByJob(jobId: string, query: { page?: number; pageSize?: number; evaluatorId?: string }) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const latestVersion = await prisma.jobVersion.findFirst({
    where: { jobId, publishedAt: { not: null } },
    orderBy: { version: 'desc' },
  });
  if (!latestVersion) throw new ApiError(404, 'NOT_FOUND', 'Published job version');

  const where: { jobVersionId: string } = { jobVersionId: latestVersion.id };

  const [total, evaluations] = await Promise.all([
    prisma.evaluation.count({ where }),
    prisma.evaluation.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { overallScore: 'desc' },
      include: {
        student: { select: { id: true, name: true, rollNumber: true, cgpa: true, department: true, program: true } },
        jobVersion: { select: { id: true, title: true, company: true, version: true, jobId: true } },
        requirementMatches: {
          include: {
            skill: true,
            requirement: true,
          },
        },
        recommendations: true,
      },
    }),
  ]);

  return {
    items: evaluations,
    total,
    page,
    pageSize,
    hasNext: skip + pageSize < total,
  };
}
