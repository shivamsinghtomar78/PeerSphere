import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/errors/api-error';
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

  if (!student) throw new ApiError(404, 'NOT_FOUND', 'Student');
  if (!jobVersion) throw new ApiError(404, 'NOT_FOUND', 'JobVersion');

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
  APPLIED: [
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  UNDER_REVIEW: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  SHORTLISTED: [
    ApplicationStatus.APPLIED,
    ApplicationStatus.INTERVIEW_SCHEDULED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  INTERVIEW_SCHEDULED: [
    ApplicationStatus.OFFER_EXTENDED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  OFFER_EXTENDED: [
    ApplicationStatus.OFFER_ACCEPTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  // Terminal states
  OFFER_ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

/** Statuses a STUDENT may set on their own application; admins use the full map. */
export const STUDENT_ALLOWED_TARGET_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.WITHDRAWN,
];

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Student applies to a published job.
 */
export async function applyToJob(studentId: string, jobId: string) {
  // 1. Verify job exists and is PUBLISHED
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job');
  if (job.status !== 'PUBLISHED') {
    throw new ApiError(400, 'BAD_REQUEST', 'Job is not open for applications');
  }

  // 2. Get the latest job version for eligibility check
  const jobVersion = await getLatestJobVersion(jobId);
  if (!jobVersion) throw new ApiError(404, 'NOT_FOUND', 'JobVersion');

  // 3. Check eligibility
  const eligibility = await checkEligibility(studentId, jobVersion.id);
  if (eligibility.status === 'INELIGIBLE') {
    throw new ApiError(422, 'UNPROCESSABLE', 'Student is not eligible for this job', {
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
      matchSummary: true,
      requiresReview: true,
      createdAt: true,
    },
  });

  const evalByJobVersionId = new Map(evaluations.map((e) => [e.jobVersionId, e]));

  const jobVersionJobMap = await prisma.jobVersion
    .findMany({
      where: { jobId: { in: jobIds } },
      orderBy: { version: 'desc' },
      distinct: ['jobId'],
      select: { id: true, jobId: true },
    })
    .then((rows) => new Map(rows.map((r) => [r.jobId, r.id])));

  const items = applications.map((app) => {
    const latestVersion = app.job.versions[0];
    const jobVersionId = jobVersionJobMap.get(app.jobId);
    const evaluation = jobVersionId ? evalByJobVersionId.get(jobVersionId) : undefined;

    return {
      id: app.id,
      studentId,
      jobId: app.jobId,
      status: app.status,
      notes: app.notes,
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

  return {
    items,
    total: items.length,
    page: 1,
    pageSize: Math.max(1, items.length),
    hasNext: false,
  };
}

/**
 * Updates the status of an application.
 */
export async function updateApplicationStatus(
  appId: string,
  newStatus: string,
  actorId: string,
  notes?: string,
) {
  // Validate the incoming status value
  if (!(newStatus in ApplicationStatus)) {
    throw new ApiError(400, 'BAD_REQUEST', `Invalid status: ${newStatus}`);
  }
  const targetStatus = newStatus as ApplicationStatus;

  const application = await prisma.application.findUnique({
    where: { id: appId },
  });
  if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application');

  // Enforce valid transitions — an illegal jump is a state conflict (409)
  const allowed = VALID_TRANSITIONS[application.status] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new ApiError(409, 'CONFLICT',
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
      throw new ApiError(400, 'BAD_REQUEST', `Invalid status filter: ${query.status}`);
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

  const studentIds = applications.map((a) => a.studentId);

  const jobVersionJobMap = new Map<string, string>();
  const jobVersions =
    applications.length > 0
      ? await prisma.jobVersion.findMany({
          where: { jobId: { in: applications.map((a) => a.jobId) } },
          orderBy: { version: 'desc' },
          distinct: ['jobId'],
          select: { id: true, jobId: true },
        })
      : [];
  jobVersions.forEach((jv) => jobVersionJobMap.set(jv.jobId, jv.id));

  const evaluations =
    jobVersions.length > 0
      ? await prisma.evaluation.findMany({
          where: {
            jobVersionId: { in: jobVersions.map((jv) => jv.id) },
            studentId: { in: studentIds },
          },
          select: {
            id: true,
            jobVersionId: true,
            studentId: true,
            overallScore: true,
            confidenceScore: true,
            coveragePercent: true,
            eligibility: true,
            status: true,
            matchSummary: true,
            requiresReview: true,
            createdAt: true,
          },
        })
      : [];

  const evalByStudentAndJob = new Map(
    evaluations
      .map((e) => {
        const jobId = [...jobVersionJobMap.entries()].find(
          ([, versionId]) => versionId === e.jobVersionId
        )?.[0];
        return jobId ? [`${e.studentId}:${jobId}`, e] : null;
      })
      .filter((entry): entry is [string, (typeof evaluations)[number]] => entry !== null)
  );

  const items = applications.map((app) => {
    const latestVersion = app.job.versions[0];
    return {
      id: app.id,
      studentId: app.studentId,
      jobId: app.jobId,
      status: app.status,
      notes: app.notes,
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
      job: {
        id: app.jobId,
        title: latestVersion?.title ?? null,
        company: latestVersion?.company ?? null,
        deadline: latestVersion?.deadline ?? null,
      },
      student: app.student,
      latestEvaluation: evalByStudentAndJob.get(`${app.studentId}:${app.jobId}`) ?? null,
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    hasNext: skip + pageSize < total,
  };
}

/**
 * Returns paginated applications for a job with student details and match scores.
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
      throw new ApiError(400, 'BAD_REQUEST', `Invalid status filter: ${query.status}`);
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
            cgpa: true,
            activeBacklogs: true,
          },
        },
      },
    }),
  ]);

  // Fetch latest evaluations for this job version to attach match scores.
  // Scores exist as soon as the engine runs (status may be REVIEW_REQUIRED
  // awaiting admin approval) — do not filter by status here.
  const jobVersion = await getLatestJobVersion(jobId);
  const studentIds = applications.map((a) => a.studentId);

  const evaluations =
    jobVersion && studentIds.length > 0
      ? await prisma.evaluation.findMany({
          where: {
            jobVersionId: jobVersion.id,
            studentId: { in: studentIds },
          },
          select: {
            id: true,
            jobVersionId: true,
            studentId: true,
            overallScore: true,
            confidenceScore: true,
            coveragePercent: true,
            eligibility: true,
            status: true,
            matchSummary: true,
            requiresReview: true,
            createdAt: true,
          },
        })
      : [];

  const evalByStudentId = new Map(evaluations.map((e) => [e.studentId, e]));

  const items = applications.map((app) => {
    const evaluation = evalByStudentId.get(app.studentId) ?? null;
    return {
      id: app.id,
      studentId: app.studentId,
      jobId,
      status: app.status,
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
      notes: app.notes,
      student: app.student,
      matchScore: evaluation,
      latestEvaluation: evaluation,
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    hasNext: skip + pageSize < total,
  };
}

// ─── Additional helper functions for API routes ───────────────────────────────

/**
 * Get application by ID
 */
export async function getApplicationById(id: string) {
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      student: {
        select: { id: true, name: true, rollNumber: true, userId: true },
      },
      job: {
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            select: { id: true, title: true, company: true },
          },
        },
      },
    },
  });
  if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application');
  return application;
}

/**
 * Check if application exists for job and student
 */
export async function getApplicationByJobAndStudent(jobId: string, studentId: string) {
  return prisma.application.findUnique({
    where: { studentId_jobId: { studentId, jobId } },
  });
}

/**
 * Create application for a published job.
 */
export async function createApplication(data: {
  jobId: string;
  studentId: string;
}) {
  // Check eligibility first
  const job = await prisma.job.findUnique({ where: { id: data.jobId } });
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job');
  if (job.status !== 'PUBLISHED') {
    throw new ApiError(400, 'BAD_REQUEST', 'Job is not open for applications');
  }

  const jobVersion = await getLatestJobVersion(data.jobId);
  if (!jobVersion) throw new ApiError(404, 'NOT_FOUND', 'JobVersion');

  const eligibility = await checkEligibility(data.studentId, jobVersion.id);
  if (eligibility.status === 'INELIGIBLE') {
    throw new ApiError(422, 'UNPROCESSABLE', 'Student is not eligible for this job', {
      reasons: eligibility.reasons,
    });
  }

  // Check if already applied
  const existing = await prisma.application.findUnique({
    where: { studentId_jobId: { studentId: data.studentId, jobId: data.jobId } },
  });
  if (existing) {
    throw new ApiError(400, 'BAD_REQUEST', 'You have already applied to this job');
  }

  return prisma.application.create({
    data: {
      studentId: data.studentId,
      jobId: data.jobId,
      status: ApplicationStatus.APPLIED,
    },
    include: {
      student: { select: { id: true, name: true, rollNumber: true } },
      job: { select: { id: true } },
    },
  });
}

/**
 * Update application
 */
export async function updateApplication(id: string, data: { status?: string; notes?: string }) {
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application');

  const updateData: { status?: ApplicationStatus; notes?: string } = {};
  if (data.status) {
    if (!(data.status in ApplicationStatus)) {
      throw new ApiError(400, 'BAD_REQUEST', `Invalid status: ${data.status}`);
    }
    updateData.status = data.status as ApplicationStatus;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  return prisma.application.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete application
 */
export async function deleteApplication(id: string) {
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application');

  return prisma.application.delete({ where: { id } });
}

/**
 * List applications by job (alias for listJobApplications)
 */
export async function listApplicationsByJob(
  jobId: string,
  query: { page?: number; pageSize?: number; status?: string }
) {
  return listJobApplications(jobId, query);
}
