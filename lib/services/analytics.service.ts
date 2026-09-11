import { prisma } from '@/lib/db/prisma';
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

// Priority is relative to cohort size — an absolute threshold is meaningless
// for a 5-student pilot and a 5,000-student campus alike.
function getSkillPriority(count: number, totalStudents: number): 'high' | 'medium' | 'low' {
  const share = totalStudents > 0 ? count / totalStudents : 0;
  if (share >= 0.5) return 'high';
  if (share >= 0.25) return 'medium';
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
  // The engine writes requirementMatch.skillId = null (the skill is reachable
  // through the requirement relation), so names resolve via requirements.
  // Aggregate per SKILL over DISTINCT students: the same skill is required by
  // several jobs, and the same student can miss it on each — grouping by
  // requirement listed "Docker" twice, and summing rows would double-count.
  const missingMatches = await prisma.requirementMatch.findMany({
    where: { matchState: 'MISSING' },
    select: {
      requirement: {
        select: {
          id: true,
          label: true,
          skill: { select: { id: true, canonicalName: true } },
        },
      },
      evaluation: { select: { studentId: true } },
    },
  });

  const totalStudents = await prisma.student.count();

  const gapBySkillId = new Map<
    string,
    { skillId: string; skillName: string; students: Set<string> }
  >();
  for (const match of missingMatches) {
    const requirement = match.requirement;
    if (!requirement) continue;
    const skillId = requirement.skill?.id ?? requirement.id;
    const skillName = requirement.skill?.canonicalName ?? requirement.label;
    const entry = gapBySkillId.get(skillId) ?? { skillId, skillName, students: new Set<string>() };
    if (match.evaluation?.studentId) entry.students.add(match.evaluation.studentId);
    gapBySkillId.set(skillId, entry);
  }

  const skillGaps: SkillGap[] = [...gapBySkillId.values()]
    .map(({ skillId, skillName, students }) => ({
      skillId,
      skillName,
      count: students.size,
      priority: getSkillPriority(students.size, totalStudents),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

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

// ─── Report generation ────────────────────────────────────────────────

export interface ReportSection {
  heading: string;
  rows: Array<{ label: string; value: string }>;
}

export interface GeneratedReport {
  id: string;
  title: string;
  category: string;
  description: string;
  generatedAt: string;
  sections: ReportSection[];
}

const pct = (part: number, whole: number): string =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%';

/**
 * Builds a report's content live from the database. Every figure is computed
 * at request time — "generatedAt" is honest, not a canned timestamp.
 */
export async function generateReport(reportId: string): Promise<GeneratedReport | null> {
  const meta = AVAILABLE_REPORTS.find((r) => r.id === reportId);
  if (!meta) return null;

  const sections: ReportSection[] = [];

  switch (reportId) {
    case 'placement-summary': {
      const stats = await getPlacementStats();
      sections.push({
        heading: 'Batch overview',
        rows: [
          { label: 'Total students', value: String(stats.totalStudents) },
          { label: 'Active jobs', value: String(stats.activeJobs) },
          { label: 'Total applications', value: String(stats.totalApplications) },
        ],
      });
      sections.push({
        heading: 'Funnel',
        rows: [
          { label: 'Shortlisted', value: String(stats.shortlisted) },
          { label: 'Offers extended', value: String(stats.offersExtended) },
          { label: 'Offers accepted', value: String(stats.offersAccepted) },
          { label: 'Placement rate', value: `${stats.placementRate}%` },
        ],
      });
      sections.push({
        heading: 'Evaluation quality',
        rows: [
          { label: 'Average match score', value: `${stats.avgMatchScore ?? 0}%` },
          { label: 'Average AI confidence', value: `${stats.avgConfidence ?? 0}%` },
        ],
      });
      break;
    }

    case 'skill-gap-analysis': {
      const { totalStudents, skillGaps } = await getSkillGaps();
      sections.push({
        heading: `Most frequently missing skills (of ${totalStudents} students)`,
        rows: skillGaps.map((gap) => ({
          label: gap.skillName,
          value: `${gap.count} student${gap.count === 1 ? '' : 's'} (${pct(gap.count, totalStudents)}) — ${gap.priority} priority`,
        })),
      });
      break;
    }

    case 'department-wise-placement': {
      const students = await prisma.student.findMany({
        select: { id: true, department: true },
      });
      const applications = await prisma.application.findMany({
        select: { studentId: true, status: true },
      });
      const deptByStudent = new Map(students.map((s) => [s.id, s.department]));
      const byDept = new Map<
        string,
        { students: number; applications: number; shortlisted: number; offers: number }
      >();
      for (const student of students) {
        const entry = byDept.get(student.department) ?? {
          students: 0,
          applications: 0,
          shortlisted: 0,
          offers: 0,
        };
        entry.students++;
        byDept.set(student.department, entry);
      }
      for (const app of applications) {
        const dept = deptByStudent.get(app.studentId);
        if (!dept) continue;
        const entry = byDept.get(dept);
        if (!entry) continue;
        entry.applications++;
        if (app.status === 'SHORTLISTED' || app.status === 'INTERVIEW_SCHEDULED') entry.shortlisted++;
        if (app.status === 'OFFER_EXTENDED' || app.status === 'OFFER_ACCEPTED') entry.offers++;
      }
      for (const [dept, data] of [...byDept.entries()].sort((a, b) => b[1].students - a[1].students)) {
        sections.push({
          heading: dept,
          rows: [
            { label: 'Students', value: String(data.students) },
            { label: 'Applications', value: String(data.applications) },
            { label: 'Shortlisted / interviewing', value: String(data.shortlisted) },
            { label: 'Offers', value: String(data.offers) },
          ],
        });
      }
      break;
    }

    case 'company-recruitment': {
      const versions = await prisma.jobVersion.findMany({
        orderBy: { version: 'desc' },
        distinct: ['jobId'],
        select: { jobId: true, title: true, company: true },
      });
      const applications = await prisma.application.findMany({
        select: { jobId: true, status: true },
      });
      const versionByJob = new Map(versions.map((v) => [v.jobId, v]));
      const byJob = new Map<string, { applied: number; shortlisted: number; interviews: number; offers: number }>();
      for (const app of applications) {
        const entry = byJob.get(app.jobId) ?? { applied: 0, shortlisted: 0, interviews: 0, offers: 0 };
        entry.applied++;
        if (app.status === 'SHORTLISTED') entry.shortlisted++;
        if (app.status === 'INTERVIEW_SCHEDULED') entry.interviews++;
        if (app.status === 'OFFER_EXTENDED' || app.status === 'OFFER_ACCEPTED') entry.offers++;
        byJob.set(app.jobId, entry);
      }
      for (const [jobId, data] of [...byJob.entries()].sort((a, b) => b[1].applied - a[1].applied)) {
        const version = versionByJob.get(jobId);
        sections.push({
          heading: version ? `${version.company} — ${version.title}` : jobId,
          rows: [
            { label: 'Applications received', value: String(data.applied) },
            { label: 'Shortlisted', value: String(data.shortlisted) },
            { label: 'Interviews scheduled', value: String(data.interviews) },
            { label: 'Offers', value: String(data.offers) },
          ],
        });
      }
      break;
    }

    case 'student-readiness': {
      const students = await prisma.student.findMany({
        select: { placementReadiness: true, profileCompleteness: true },
      });
      const total = students.length;
      const bands: Array<{ label: string; min: number; max: number }> = [
        { label: 'Ready (80–100)', min: 80, max: 100 },
        { label: 'Almost ready (60–79)', min: 60, max: 79 },
        { label: 'Developing (40–59)', min: 40, max: 59 },
        { label: 'Early stage (0–39)', min: 0, max: 39 },
      ];
      sections.push({
        heading: `Placement-readiness distribution (${total} students)`,
        rows: bands.map((band) => {
          const count = students.filter(
            (s) => s.placementReadiness >= band.min && s.placementReadiness <= band.max
          ).length;
          return { label: band.label, value: `${count} student${count === 1 ? '' : 's'} (${pct(count, total)})` };
        }),
      });
      const avgReadiness = total
        ? Math.round(students.reduce((sum, s) => sum + s.placementReadiness, 0) / total)
        : 0;
      const avgCompleteness = total
        ? Math.round(students.reduce((sum, s) => sum + s.profileCompleteness, 0) / total)
        : 0;
      sections.push({
        heading: 'Batch averages',
        rows: [
          { label: 'Average readiness score', value: `${avgReadiness}%` },
          { label: 'Average profile completeness', value: `${avgCompleteness}%` },
        ],
      });
      break;
    }

    case 'evaluation-audit': {
      const [evaluations, reviewRequired, overrides] = await Promise.all([
        prisma.evaluation.count(),
        prisma.evaluation.count({ where: { requiresReview: true } }),
        prisma.reviewOverride.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            actor: { select: { email: true } },
            evaluation: {
              select: {
                student: { select: { name: true } },
                jobVersion: { select: { title: true, company: true } },
              },
            },
          },
        }),
      ]);
      const totalOverrides = await prisma.reviewOverride.count();
      sections.push({
        heading: 'Evaluation pipeline',
        rows: [
          { label: 'Total evaluations', value: String(evaluations) },
          { label: 'Flagged for human review', value: String(reviewRequired) },
          { label: 'Manual overrides recorded', value: String(totalOverrides) },
        ],
      });
      sections.push({
        heading: `Most recent overrides (${Math.min(10, totalOverrides)} of ${totalOverrides})`,
        rows: overrides.map((override) => ({
          label: `${new Date(override.createdAt).toISOString().slice(0, 16).replace('T', ' ')} — ${
            override.evaluation.student.name
          } · ${override.evaluation.jobVersion.company} (${override.evaluation.jobVersion.title})`,
          value: `${override.decision.toUpperCase()} by ${override.actor.email}: “${override.reason}”`,
        })),
      });
      break;
    }

    default:
      return null;
  }

  return {
    id: meta.id,
    title: meta.title,
    category: meta.category,
    description: meta.description,
    generatedAt: new Date().toISOString(),
    sections,
  };
}
