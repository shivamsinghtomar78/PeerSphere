import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/errors/api-error';
import { Prisma } from '@prisma/client';

export type CreateJobDto = {
  title: string;
  company: string;
  location: string;
  workMode: string;
  jobType: string;
  salary?: string;
  description: string;
  deadline: string;
  minCgpa?: number;
  maxBacklogs: number;
  allowedDepartments: string[];
  allowedPrograms: string[];
  requiredSkills: string[];
  preferredSkills: string[];
};

/**
 * Find or create a skill by canonicalName.
 * Uses upsert so concurrent requests don't race on the unique constraint.
 */
async function findOrCreateSkill(name: string): Promise<{ id: string; canonicalName: string }> {
  return prisma.skill.upsert({
    where: { canonicalName: name.trim() },
    create: {
      canonicalName: name.trim(),
      category: 'GENERAL',
      aliases: [],
    },
    update: {},
    select: { id: true, canonicalName: true },
  });
}

/**
 * Get the latest JobVersion for a job (by highest version number).
 */
async function latestVersion(jobId: string) {
  return prisma.jobVersion.findFirst({
    where: { jobId },
    orderBy: { version: 'desc' },
  });
}

// ─── listJobs ─────────────────────────────────────────────────────

export async function listJobs(
  query: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    department?: string;
  },
  options: { allStatusesByDefault?: boolean } = {}
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const jobWhere: Prisma.JobWhereInput = {};

  if (query.status) {
    jobWhere.status = query.status as Prisma.EnumJobStatusFilter;
  } else if (!options.allStatusesByDefault) {
    // Public/student callers only ever see published jobs
    jobWhere.status = 'PUBLISHED';
  }

  const versionFilter: Prisma.JobVersionWhereInput = {};

  if (query.search) {
    const search = query.search.trim();
    versionFilter.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (query.department) {
    versionFilter.allowedDepartments = {
      has: query.department,
    };
  }

  if (Object.keys(versionFilter).length > 0) {
    jobWhere.versions = { some: versionFilter };
  }

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where: jobWhere }),
    prisma.job.findMany({
      where: jobWhere,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          select: {
            id: true,
            version: true,
            title: true,
            company: true,
            location: true,
            workMode: true,
            jobType: true,
            salary: true,
            deadline: true,
            minCgpa: true,
            maxBacklogs: true,
            allowedDepartments: true,
            allowedPrograms: true,
            requirements: {
              select: {
                id: true,
                type: true,
                required: true,
                weight: true,
                label: true,
                skill: { select: { canonicalName: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  // Live counts — never trust the denormalized applicationCount fields on
  // JobVersion, they drift (seed, status changes, etc.)
  const jobIds = jobs.map((j) => j.id);
  const [appCountRows, shortlistedRows] = await Promise.all([
    prisma.application.groupBy({
      by: ['jobId'],
      where: { jobId: { in: jobIds } },
      _count: { _all: true },
    }),
    prisma.application.groupBy({
      by: ['jobId'],
      where: { jobId: { in: jobIds }, status: 'SHORTLISTED' },
      _count: { _all: true },
    }),
  ]);
  const appCountByJob = new Map(appCountRows.map((r) => [r.jobId, r._count._all]));
  const shortlistedByJob = new Map(shortlistedRows.map((r) => [r.jobId, r._count._all]));

  const items = jobs
    .filter((j) => j.versions.length > 0)
    .map((j) => {
      const v = j.versions[0];
      return {
        jobId: j.id,
        status: j.status,
        jobVersionId: v.id,
        title: v.title,
        company: v.company,
        location: v.location,
        workMode: v.workMode,
        jobType: v.jobType,
        salary: v.salary,
        deadline: v.deadline,
        applicationCount: appCountByJob.get(j.id) ?? 0,
        shortlistedCount: shortlistedByJob.get(j.id) ?? 0,
        minCgpa: v.minCgpa,
        maxBacklogs: v.maxBacklogs,
        allowedDepartments: v.allowedDepartments,
        allowedPrograms: v.allowedPrograms,
        requirements: v.requirements.map((r) => ({
          id: r.id,
          type: r.type,
          required: r.required,
          weight: r.weight,
          label: r.label,
          skillName: r.skill?.canonicalName ?? null,
        })),
      };
    });

  return {
    items,
    total,
    page,
    pageSize,
    hasNext: skip + items.length < total,
  };
}

// ─── getJob ───────────────────────────────────────────────────────

export async function getJob(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          requirements: {
            include: {
              skill: true,
            },
          },
        },
      },
    },
  });

  if (!job || job.versions.length === 0) {
    throw new ApiError(404, 'NOT_FOUND', 'Job');
  }

  const [applicationCount, shortlistedCount] = await Promise.all([
    prisma.application.count({ where: { jobId } }),
    prisma.application.count({ where: { jobId, status: 'SHORTLISTED' } }),
  ]);

  const version = job.versions[0];
  return {
    jobId: job.id,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    version: {
      jobVersionId: version.id,
      versionNumber: version.version,
      title: version.title,
      company: version.company,
      location: version.location,
      workMode: version.workMode,
      jobType: version.jobType,
      salary: version.salary,
      description: version.description,
      deadline: version.deadline,
      minCgpa: version.minCgpa,
      maxBacklogs: version.maxBacklogs,
      allowedDepartments: version.allowedDepartments,
      allowedPrograms: version.allowedPrograms,
      applicationCount,
      shortlistedCount,
      publishedAt: version.publishedAt,
      createdAt: version.createdAt,
      requirements: version.requirements.map((r) => ({
        id: r.id,
        type: r.type,
        required: r.required,
        weight: r.weight,
        label: r.label,
        skill: r.skill
          ? {
              id: r.skill.id,
              canonicalName: r.skill.canonicalName,
              category: r.skill.category,
              aliases: r.skill.aliases,
            }
          : null,
      })),
    },
  };
}

// ─── createJob ────────────────────────────────────────────────────

export async function createJob(createdById: string, data: CreateJobDto) {
  const [requiredSkills, preferredSkills] = await Promise.all([
    Promise.all(data.requiredSkills.map(findOrCreateSkill)),
    Promise.all(data.preferredSkills.map(findOrCreateSkill)),
  ]);

  const job = await prisma.job.create({
    data: {
      createdById,
      status: 'DRAFT',
      versions: {
        create: {
          version: 1,
          title: data.title,
          company: data.company,
          location: data.location,
          workMode: data.workMode as any,
          jobType: data.jobType as any,
          salary: data.salary,
          description: data.description,
          deadline: new Date(data.deadline),
          minCgpa: data.minCgpa != null ? data.minCgpa : undefined,
          maxBacklogs: data.maxBacklogs,
          allowedDepartments: data.allowedDepartments,
          allowedPrograms: data.allowedPrograms,
          requirements: {
            create: [
              ...requiredSkills.map((skill) => ({
                type: 'HARD' as const,
                required: true,
                label: skill.canonicalName,
                weight: 1.0,
                skillId: skill.id,
              })),
              ...preferredSkills.map((skill) => ({
                type: 'SOFT' as const,
                required: false,
                label: skill.canonicalName,
                weight: 0.5,
                skillId: skill.id,
              })),
            ],
          },
        },
      },
    },
    include: {
      versions: {
        include: {
          requirements: {
            include: { skill: true },
          },
        },
      },
    },
  });

  return job;
}

// ─── updateJob ────────────────────────────────────────────────────

export async function updateJob(jobId: string, data: Partial<CreateJobDto>) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job');
  if (job.status !== 'DRAFT') {
    throw new ApiError(400, 'BAD_REQUEST', 'Only DRAFT jobs can be updated');
  }

  const prev = await latestVersion(jobId);
  if (!prev) throw new ApiError(404, 'NOT_FOUND', 'Job version');

  const prevRequirements = await prisma.jobRequirement.findMany({
    where: { jobVersionId: prev.id },
    include: { skill: true },
  });

  let requiredSkills: { id: string; canonicalName: string }[] | null = null;
  let preferredSkills: { id: string; canonicalName: string }[] | null = null;

  if (data.requiredSkills) {
    requiredSkills = await Promise.all(data.requiredSkills.map(findOrCreateSkill));
  }
  if (data.preferredSkills) {
    preferredSkills = await Promise.all(data.preferredSkills.map(findOrCreateSkill));
  }

  let newRequirements: Prisma.JobRequirementCreateWithoutJobVersionInput[];

  if (requiredSkills !== null || preferredSkills !== null) {
    const prevRequired = prevRequirements
      .filter((r) => r.type === 'HARD')
      .map((r) => ({ id: r.skillId!, canonicalName: r.label }));
    const prevPreferred = prevRequirements
      .filter((r) => r.type === 'SOFT')
      .map((r) => ({ id: r.skillId!, canonicalName: r.label }));

    const finalRequired = requiredSkills ?? prevRequired;
    const finalPreferred = preferredSkills ?? prevPreferred;

    newRequirements = [
      ...finalRequired.map((skill) => ({
        type: 'HARD' as const,
        required: true,
        label: skill.canonicalName,
        weight: 1.0,
        skillId: skill.id,
      })),
      ...finalPreferred.map((skill) => ({
        type: 'SOFT' as const,
        required: false,
        label: skill.canonicalName,
        weight: 0.5,
        skillId: skill.id,
      })),
    ];
  } else {
    newRequirements = prevRequirements.map((r) => ({
      type: r.type,
      required: r.required,
      label: r.label,
      weight: r.weight,
      skillId: r.skillId ?? undefined,
    }));
  }

  const newVersion = await prisma.jobVersion.create({
    data: {
      jobId,
      version: prev.version + 1,
      title: data.title ?? prev.title,
      company: data.company ?? prev.company,
      location: data.location ?? prev.location,
      workMode: (data.workMode as any) ?? prev.workMode,
      jobType: (data.jobType as any) ?? prev.jobType,
      salary: data.salary !== undefined ? data.salary : prev.salary,
      description: data.description ?? prev.description,
      deadline: data.deadline ? new Date(data.deadline) : prev.deadline,
      minCgpa: data.minCgpa !== undefined ? data.minCgpa : prev.minCgpa,
      maxBacklogs: data.maxBacklogs ?? prev.maxBacklogs,
      allowedDepartments: data.allowedDepartments ?? prev.allowedDepartments,
      allowedPrograms: data.allowedPrograms ?? prev.allowedPrograms,
      requirements: {
        create: newRequirements,
      },
    },
    include: {
      requirements: {
        include: { skill: true },
      },
    },
  });

  return newVersion;
}

// ─── publishJob ───────────────────────────────────────────────────

export async function publishJob(jobId: string, actorId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job');
  if (job.status === 'PUBLISHED') {
    throw new ApiError(409, 'CONFLICT', 'Job is already published');
  }

  const version = await latestVersion(jobId);
  if (!version) throw new ApiError(404, 'NOT_FOUND', 'Job version');

  const [updatedJob] = await prisma.$transaction([
    prisma.job.update({
      where: { id: jobId },
      data: { status: 'PUBLISHED' },
    }),
    prisma.jobVersion.update({
      where: { id: version.id },
      data: { publishedAt: new Date() },
    }),
    prisma.auditEvent.create({
      data: {
        actorId,
        action: 'JOB_PUBLISHED',
        resourceType: 'Job',
        resourceId: jobId,
        metadata: { jobVersionId: version.id, versionNumber: version.version },
      },
    }),
  ]);

  return updatedJob;
}

// ─── closeJob ─────────────────────────────────────────────────────

export async function closeJob(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, 'NOT_FOUND', 'Job');
  if (job.status === 'CLOSED') {
    throw new ApiError(409, 'CONFLICT', 'Job is already closed');
  }

  return prisma.job.update({
    where: { id: jobId },
    data: { status: 'CLOSED' },
  });
}

// ─── Additional helper functions for API routes ───────────────────────────────

/**
 * Get job by ID (alias for getJob)
 */
export async function getJobById(id: string) {
  return getJob(id);
}
