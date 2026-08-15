import { prisma } from '../../lib/prisma';
import { ApiError } from '../../errors/ApiError';
import { ApplicationStatus } from '@prisma/client';

// ─── Eligibility engine ───────────────────────────────────────────────────────

interface EligibilityResult {
  status: 'ELIGIBLE' | 'INELIGIBLE' | 'CONDITIONAL';
  reasons: string[];
}

async function checkEligibility(
  studentId: string,
  jobVersionId: string,
): Promise<EligibilityResult> {
  const [student, jobVersion] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.jobVersion.findUnique({ where: { id: jobVersionId } }),
  ]);

  if (!student) throw ApiError.notFound('Student');
  if (!jobVersion) throw ApiError.notFound('JobVersion');

  const reasons: string[] = [];

  // CGPA check
  if (jobVersion.minCgpa !== null && jobVersion.minCgpa !== undefined) {
    const studentCgpa = student.cgpa ? Number(student.cgpa) : 0;
    if (studentCgpa < Number(jobVersion.minCgpa)) {
      reasons.push(
        `CGPA ${studentCgpa} is below the required minimum of ${jobVersion.minCgpa}`,
      );
    }
  }

  // Active backlogs check
  if (student.activeBacklogs > jobVersion.maxBacklogs) {
    reasons.push(
      `Active backlogs (${student.activeBacklogs}) exceed the allowed maximum of ${jobVersion.maxBacklogs}`,
    );
  }

  // Department check
  if (
    jobVersion.allowedDepartments.length > 0 &&
    !jobVersion.allowedDepartments.includes(student.department)
  ) {
    reasons.push(
      `Department "${student.department}" is not in the allowed list: ${jobVersion.allowedDepartments.join(', ')}`,
    );
  }

  // Program check
  if (
    jobVersion.allowedPrograms.length > 0 &&
    !jobVersion.allowedPrograms.includes(student.program)
  ) {
    reasons.push(
      `Program "${student.program}" is not in the allowed list: ${jobVersion.allowedPrograms.join(', ')}`,
    );
  }

  if (reasons.length > 0) {
    return { status: 'INELIGIBLE', reasons };
  }

  return { status: 'ELIGIBLE', reasons: [] };
}

// ─── Helper: get latest job version for a job ─────────────────────────────────

async function getLatestJobVersion(jobId: string) {
  return prisma.jobVersion.findFirst({
    where: { jobId },
    orderBy: { version: 'desc' },
  });
}

// ─── Valid status transition map ──────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  APPLIED: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED],
  UNDER_REVIEW: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
  ],
  SHORTLISTED: [
    ApplicationStatus.INTERVIEW_SCHEDULED,
    ApplicationStatus.REJECTED,
  ],
  INTERVIEW_SCHEDULED: [
    ApplicationStatus.OFFER_EXTENDED,
    ApplicationStatus.REJECTED,
  ],
  OFFER_EXTENDED: [
    ApplicationStatus.OFFER_ACCEPTED,
    ApplicationStatus.REJECTED,
  ],
  OFFER_ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Student applies to a published job.
 * - Verifies job is PUBLISHED
 * - Checks eligibility; throws 422 if INELIGIBLE
 * - Upserts the application (returns existing if already applied)
 * - Increments applicationCount on the latest job version
 */
export async function applyToJob(studentId: string, jobId: string) {
  // 1. Verify job exists and is PUBLISHED
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw ApiError.notFound('Job');
  if (job.status !== 'PUBLISHED') {
    throw ApiError.badRequest('Job is not open for applications');
  }

  // 2. Get the latest job version for eligibility check
  const jobVersion = await getLatestJobVersion(jobId);
  if (!jobVersion) throw ApiError.notFound('JobVersion');

  // 3. Check eligibility
  const eligibility = await checkEligibility(studentId, jobVersion.id);
  if (eligibility.status === 'INELIGIBLE') {
    throw ApiError.unprocessable('Student is not eligible for this job', {
      reasons: eligibility.reasons,
    });
  }

  // 4. Check if application already exists
  const existing = await prisma.application.findUnique({
    where: { studentId_jobId: { studentId, jobId } },
  });

  if (existing) {
    return { application: existing, alreadyExists: true };
  }

  // 5. Create application and increment applicationCount atomically
  const [application] = await prisma.$transaction([
    prisma.application.create({
      data: { studentId, jobId, status: ApplicationStatus.APPLIED },
    }),
    prisma.jobVersion.update({
      where: { id: jobVersion.id },
      data: { applicationCount: { increment: 1 } },
    }),
  ]);

  return { application, alreadyExists: false };
}

/**
 * Returns all applications for a student including job details and latest evaluation.
 */
export async function listMyApplications(studentId: string) {
  const applications = await prisma.application.findMany({
    where: { studentId },
    orderBy: { appliedAt: 'desc' },
    include: {
      job: {
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            select: {
              title: true,
              company: true,
              deadline: true,
            },
          },
        },
      },
    },
  });

  // Fetch latest evaluation for each job the student applied to
  const jobIds = applications.map((a) => a.jobId);
  const jobVersionIds = await prisma.jobVersion
    .findMany({
      where: { jobId: { in: jobIds } },
      orderBy: { version: 'desc' },
      distinct: ['jobId'],
      select: { id: true, jobId: true },
    })
    .then((rows) => rows.map((r) => r.id));

  const evaluations = await prisma.evaluation.findMany({
    where: {
      studentId,
      jobVersionId: { in: jobVersionIds },
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['jobVersionId'],
    select: {
      id: true,
      jobVersionId: true,
      eligibility: true,
      status: true,
      overallScore: true,
      confidenceScore: true,
      coveragePercent: true,
    },
  });

  // Build a map of jobVersionId -> evaluation
  const evalByJobVersionId = new Map(evaluations.map((e) => [e.jobVersionId, e]));

  // Build jobVersionId -> jobId map for lookup
  const jobVersionJobMap = await prisma.jobVersion
    .findMany({
      where: { jobId: { in: jobIds } },
      orderBy: { version: 'desc' },
      distinct: ['jobId'],
      select: { id: true, jobId: true },
    })
    .then((rows) => new Map(rows.map((r) => [r.jobId, r.id])));

  return applications.map((app) => {
    const latestVersion = app.job.versions[0];
    const jobVersionId = jobVersionJobMap.get(app.jobId);
    const evaluation = jobVersionId ? evalByJobVersionId.get(jobVersionId) : undefined;

    return {
      id: app.id,
      status: app.status,
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
      job: {
        id: app.jobId,
        title: latestVersion?.title ?? null,
        company: latestVersion?.company ?? null,
        deadline: latestVersion?.deadline ?? null,
      },
      latestEvaluation: evaluation ?? null,
    };
  });
}

/**
 * Updates the status of an application (PLACEMENT_ADMIN only).
 * Enforces valid transition rules and writes an AuditEvent.
 * Increments shortlistedCount when transitioning to SHORTLISTED.
 */
export async function updateApplicationStatus(
  appId: string,
  newStatus: string,
  actorId: string,
  notes?: string,
) {
  // Validate the incoming status value
  if (!(newStatus in ApplicationStatus)) {
    throw ApiError.badRequest(`Invalid status: ${newStatus}`);
  }
  const targetStatus = newStatus as ApplicationStatus;

  const application = await prisma.application.findUnique({
    where: { id: appId },
  });
  if (!application) throw ApiError.notFound('Application');

  // Enforce valid transitions
  const allowed = VALID_TRANSITIONS[application.status] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw ApiError.badRequest(
      `Cannot transition from ${application.status} to ${targetStatus}`,
    );
  }

  // Build update payload
  const updateData: { status: ApplicationStatus; notes?: string } = {
    status: targetStatus,
  };
  if (notes !== undefined) updateData.notes = notes;

  // Determine if we need to increment shortlistedCount
  const isShortlisting = targetStatus === ApplicationStatus.SHORTLISTED;

  // Fetch latest job version if shortlisting
  let jobVersionId: string | undefined;
  if (isShortlisting) {
    const jv = await getLatestJobVersion(application.jobId);
    jobVersionId = jv?.id;
  }

  const operations = [
    prisma.application.update({
      where: { id: appId },
      data: updateData,
    }),
    prisma.auditEvent.create({
      data: {
        actorId,
        action: 'APPLICATION_STATUS_CHANGED',
        resourceType: 'Application',
        resourceId: appId,
        metadata: {
          previousStatus: application.status,
          newStatus: targetStatus,
          notes: notes ?? null,
        },
      },
    }),
  ] as const;

  const [updatedApplication] = await prisma.$transaction([...operations]);

  if (isShortlisting && jobVersionId) {
    await prisma.jobVersion.update({
      where: { id: jobVersionId },
      data: { shortlistedCount: { increment: 1 } },
    });
  }

  return updatedApplication;
}

/**
 * Returns ALL paginated applications for PLACEMENT_ADMIN with full details.
 */
export async function listAllApplications(
  query: { status?: string; page?: number; pageSize?: number },
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: { status?: ApplicationStatus } = {};

  if (query.status) {
    if (!(query.status in ApplicationStatus)) {
      throw ApiError.badRequest(`Invalid status filter: ${query.status}`);
    }
    where.status = query.status as ApplicationStatus;
  }

  const [total, applications] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { appliedAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            department: true,
            program: true,
            year: true,
            cgpa: true,
            activeBacklogs: true,
          },
        },
        job: {
          include: {
            versions: {
              orderBy: { version: 'desc' },
              take: 1,
              select: {
                id: true,
                title: true,
                company: true,
                deadline: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    items: applications,
    total,
    page,
    pageSize,
    hasNext: skip + pageSize < total,
  };
}

/**
 * Returns paginated applications for a job with student details and match scores.
 * For PLACEMENT_ADMIN use.
 */
export async function listJobApplications(
  jobId: string,
  query: { status?: string; page?: number; pageSize?: number },
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: { jobId: string; status?: ApplicationStatus } = { jobId };

  if (query.status) {
    if (!(query.status in ApplicationStatus)) {
      throw ApiError.badRequest(`Invalid status filter: ${query.status}`);
    }
    where.status = query.status as ApplicationStatus;
  }

  const [total, applications] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { appliedAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            department: true,
            program: true,
            year: true,
            cgpa: true,
            activeBacklogs: true,
          },
        },
      },
    }),
  ]);

  // Fetch latest evaluations for this job version to attach match scores
  const jobVersion = await getLatestJobVersion(jobId);
  const studentIds = applications.map((a) => a.studentId);

  const evaluations =
    jobVersion && studentIds.length > 0
      ? await prisma.evaluation.findMany({
          where: {
            jobVersionId: jobVersion.id,
            studentId: { in: studentIds },
            status: 'COMPLETED',
          },
          select: {
            studentId: true,
            overallScore: true,
            confidenceScore: true,
            coveragePercent: true,
            eligibility: true,
          },
        })
      : [];

  const evalByStudentId = new Map(evaluations.map((e) => [e.studentId, e]));

  const items = applications.map((app) => ({
    id: app.id,
    status: app.status,
    appliedAt: app.appliedAt,
    updatedAt: app.updatedAt,
    notes: app.notes,
    student: app.student,
    matchScore: evalByStudentId.get(app.studentId) ?? null,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    hasNext: skip + pageSize < total,
  };
}
