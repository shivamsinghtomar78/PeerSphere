import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../errors/ApiError';
import { EvaluationStatus } from '@prisma/client';
import { computeMatch, StudentSkillInput, JobSkillRequirement } from '../../engines/matching.engine';
import { checkEligibility } from '../../engines/eligibility.engine';
import { analyzeSkillGaps } from '../../engines/skillgap.engine';

export async function queueEvaluation(studentId: string, jobId: string) {
  // 1. Get latest published JobVersion
  const jobVersion = await prisma.jobVersion.findFirst({
    where: { jobId, job: { status: 'PUBLISHED' }, publishedAt: { not: null } },
    orderBy: { version: 'desc' },
    include: { requirements: { include: { skill: true } } },
  });
  if (!jobVersion) throw ApiError.notFound('Published job for this drive');

  // 2. Get student with skills
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { skillEvidence: { include: { skill: true } } },
  });
  if (!student) throw ApiError.notFound('Student');

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

  // 4. Build snapshot and hash (idempotency)
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
  const snapshotHash = crypto.createHash('sha256').update(JSON.stringify(inputSnapshot)).digest('hex');

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
  const eligResult = checkEligibility({
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
    await prisma.requirementMatch.createMany({
      data: matchResult.details.map((d) => ({
        evaluationId: evaluation.id,
        requirementId: d.requirementId,
        skillId: null,
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
  if (!evaluation) throw ApiError.notFound('Evaluation');
  if (requestingRole === 'STUDENT' && evaluation.student.userId !== requestingUserId) {
    throw ApiError.forbidden();
  }
  return evaluation;
}

export async function listStudentEvaluations(studentId: string) {
  return prisma.evaluation.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: { jobVersion: { select: { id: true, title: true, company: true, version: true, jobId: true } } },
  });
}

export async function listJobEvaluations(jobId: string) {
  const latestVersion = await prisma.jobVersion.findFirst({
    where: { jobId, publishedAt: { not: null } },
    orderBy: { version: 'desc' },
  });
  if (!latestVersion) throw ApiError.notFound('Published job version');

  return prisma.evaluation.findMany({
    where: { jobVersionId: latestVersion.id },
    orderBy: { overallScore: 'desc' },
    include: {
      student: { select: { id: true, name: true, rollNumber: true, cgpa: true, department: true, program: true } },
      jobVersion: { select: { id: true, title: true, company: true, version: true } },
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
      throw ApiError.badRequest(`Invalid status filter: ${query.status}`);
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
