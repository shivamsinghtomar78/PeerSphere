/**
 * PeerSphere — Database Seed Script
 * Populates skills taxonomy, demo users, students, jobs, and evaluations
 * that match the frontend mock data exactly.
 *
 * Run: npx ts-node prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { computeMatch, StudentSkillInput, JobSkillRequirement } from '../lib/engines/matching.engine';
import { checkEligibility } from '../lib/engines/eligibility.engine';
import { analyzeSkillGaps } from '../lib/engines/skillgap.engine';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PeerSphere database…');

  // ── 1. Skills Taxonomy ──────────────────────────────────────────
  console.log('  Creating skills taxonomy…');
  const skillsData = [
    { canonicalName: 'Java', category: 'Programming', aliases: ['java', 'Java SE', 'Java EE'] },
    { canonicalName: 'Spring Boot', category: 'Framework', aliases: ['springboot', 'spring-boot', 'Spring Framework'] },
    { canonicalName: 'REST API', category: 'Architecture', aliases: ['REST', 'RESTful', 'REST API Design', 'RESTful API'] },
    { canonicalName: 'SQL', category: 'Database', aliases: ['MySQL', 'PostgreSQL', 'Structured Query Language'] },
    { canonicalName: 'Data Structures & Algorithms', category: 'CS Fundamentals', aliases: ['DSA', 'Data Structures', 'Algorithms'] },
    { canonicalName: 'Git', category: 'Tools', aliases: ['git', 'version control', 'GitHub'] },
    { canonicalName: 'Python', category: 'Programming', aliases: ['python3', 'Python 3'] },
    { canonicalName: 'React', category: 'Frontend', aliases: ['ReactJS', 'React.js'] },
    { canonicalName: 'TypeScript', category: 'Programming', aliases: ['TS', 'typescript'] },
    { canonicalName: 'Node.js', category: 'Backend', aliases: ['NodeJS', 'Node', 'node.js'] },
    { canonicalName: 'PostgreSQL', category: 'Database', aliases: ['Postgres', 'PG'] },
    { canonicalName: 'Docker', category: 'DevOps', aliases: ['docker', 'containerization'] },
    { canonicalName: 'AWS', category: 'Cloud', aliases: ['Amazon Web Services', 'AWS Basics', 'AWS Cloud'] },
    { canonicalName: 'Linux', category: 'Systems', aliases: ['linux', 'Unix', 'bash'] },
    { canonicalName: 'Kubernetes', category: 'DevOps', aliases: ['k8s', 'K8s'] },
    { canonicalName: 'Redis', category: 'Database', aliases: ['redis', 'in-memory cache'] },
    { canonicalName: 'System Design', category: 'Architecture', aliases: ['HLD', 'LLD', 'High Level Design'] },
    { canonicalName: 'Pandas', category: 'Data Science', aliases: ['pandas', 'python pandas'] },
    { canonicalName: 'Excel', category: 'Tools', aliases: ['Microsoft Excel', 'Spreadsheets', 'Excel/Spreadsheets'] },
    { canonicalName: 'Power BI', category: 'Analytics', aliases: ['PowerBI', 'power bi'] },
  ];

  const skills: Record<string, string> = {};
  for (const s of skillsData) {
    const skill = await prisma.skill.upsert({
      where: { canonicalName: s.canonicalName },
      update: { aliases: s.aliases },
      create: { canonicalName: s.canonicalName, category: s.category, aliases: s.aliases },
    });
    skills[s.canonicalName] = skill.id;
  }
  console.log(`  ✓ ${skillsData.length} skills created`);

  // ── 2. Users & Students ─────────────────────────────────────────
  console.log('  Creating users and students…');
  const hash = (p: string) => bcrypt.hashSync(p, 10);

  const usersData = [
    {
      email: 'arjun.sharma@college.edu', password: 'student123', role: 'STUDENT' as const,
      student: {
        name: 'Arjun Sharma', rollNumber: '21CS001', department: 'Computer Science',
        program: 'B.Tech', year: 4, cgpa: 8.4, activeBacklogs: 0, totalBacklogs: 0,
        profileCompleteness: 90, placementReadiness: 82,
        skillNames: ['Java', 'SQL', 'Git', 'Python'],
      },
    },
    {
      email: 'priya.nair@college.edu', password: 'student123', role: 'STUDENT' as const,
      student: {
        name: 'Priya Nair', rollNumber: '21CS002', department: 'Computer Science',
        program: 'B.Tech', year: 4, cgpa: 9.1, activeBacklogs: 0, totalBacklogs: 0,
        profileCompleteness: 98, placementReadiness: 94,
        skillNames: ['Java', 'Spring Boot', 'REST API', 'SQL', 'Data Structures & Algorithms', 'Git'],
      },
    },
    {
      email: 'rohan.mehta@college.edu', password: 'student123', role: 'STUDENT' as const,
      student: {
        name: 'Rohan Mehta', rollNumber: '21CS003', department: 'Computer Science',
        program: 'B.Tech', year: 4, cgpa: 7.6, activeBacklogs: 0, totalBacklogs: 1,
        profileCompleteness: 75, placementReadiness: 64,
        skillNames: ['Java', 'SQL'],
      },
    },
    {
      email: 'anika.kapoor@college.edu', password: 'student123', role: 'STUDENT' as const,
      student: {
        name: 'Anika Kapoor', rollNumber: '21CS004', department: 'Information Technology',
        program: 'B.Tech', year: 4, cgpa: 8.8, activeBacklogs: 0, totalBacklogs: 0,
        profileCompleteness: 95, placementReadiness: 89,
        skillNames: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git'],
      },
    },
    {
      email: 'vikram.reddy@college.edu', password: 'student123', role: 'STUDENT' as const,
      student: {
        name: 'Vikram Reddy', rollNumber: '21CS005', department: 'Computer Science',
        program: 'B.Tech', year: 4, cgpa: 7.2, activeBacklogs: 1, totalBacklogs: 2,
        profileCompleteness: 65, placementReadiness: 56,
        skillNames: ['Python', 'SQL'],
      },
    },
    {
      email: 'placement@college.edu', password: 'admin123', role: 'PLACEMENT_ADMIN' as const,
      student: null,
    },
  ];

  const userIds: Record<string, string> = {};
  const studentIds: Record<string, string> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, passwordHash: hash(u.password), role: u.role },
    });
    userIds[u.email] = user.id;

    if (u.student) {
      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          name: u.student.name,
          rollNumber: u.student.rollNumber,
          department: u.student.department,
          program: u.student.program,
          year: u.student.year,
          cgpa: u.student.cgpa,
          activeBacklogs: u.student.activeBacklogs,
          totalBacklogs: u.student.totalBacklogs,
          profileCompleteness: u.student.profileCompleteness,
          placementReadiness: u.student.placementReadiness,
        },
      });
      studentIds[u.student.rollNumber] = student.id;

      // Add skill evidence
      for (const skillName of u.student.skillNames) {
        const skillId = skills[skillName];
        if (!skillId) continue;
        await prisma.studentSkillEvidence.upsert({
          where: { studentId_skillId: { studentId: student.id, skillId } },
          update: {},
          create: { studentId: student.id, skillId, source: 'MANUAL', confidence: 80 },
        });
      }
    }
  }
  console.log(`  ✓ ${usersData.length} users, ${Object.keys(studentIds).length} students created`);

  // ── 3. Jobs ─────────────────────────────────────────────────────
  console.log('  Creating jobs…');
  const adminId = userIds['placement@college.edu'];

  const jobsData = [
    {
      key: 'job-001',
      title: 'Backend Developer', company: 'ABC Technologies',
      location: 'Bengaluru, Karnataka', workMode: 'HYBRID', jobType: 'FULL_TIME',
      salary: '₹12–18 LPA',
      description: 'Join our backend engineering team to build the next generation of fintech infrastructure. You will work on high-traffic, distributed systems serving millions of users.',
      deadline: new Date('2026-09-01'),
      minCgpa: 7.5, maxBacklogs: 0,
      allowedDepartments: ['Computer Science', 'Information Technology'],
      allowedPrograms: ['B.Tech', 'M.Tech'],
      requiredSkills: ['Java', 'Spring Boot', 'REST API', 'SQL', 'Data Structures & Algorithms'],
      preferredSkills: ['Docker', 'AWS'],
    },
    {
      key: 'job-002',
      title: 'Software Development Engineer', company: 'InnovateTech Solutions',
      location: 'Hyderabad, Telangana', workMode: 'ONSITE', jobType: 'FULL_TIME',
      salary: '₹10–15 LPA',
      description: 'A great opportunity to join a growing product company working on enterprise software solutions.',
      deadline: new Date('2026-09-10'),
      minCgpa: 7.0, maxBacklogs: 1,
      allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics'],
      allowedPrograms: ['B.Tech', 'M.Tech'],
      requiredSkills: ['Java', 'Data Structures & Algorithms', 'SQL', 'Git'],
      preferredSkills: ['Spring Boot', 'Python'],
    },
    {
      key: 'job-003',
      title: 'Full Stack Developer', company: 'StartupX Labs',
      location: 'Pune, Maharashtra', workMode: 'REMOTE', jobType: 'FULL_TIME',
      salary: '₹8–14 LPA',
      description: 'Join our fast-moving startup to build products that reach thousands of users.',
      deadline: new Date('2026-08-30'),
      minCgpa: 7.0, maxBacklogs: 0,
      allowedDepartments: ['Computer Science', 'Information Technology'],
      allowedPrograms: ['B.Tech'],
      requiredSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      preferredSkills: ['Docker', 'Redis'],
    },
    {
      key: 'job-004',
      title: 'Data Analyst Intern', company: 'DataInsights Corp',
      location: 'Remote', workMode: 'REMOTE', jobType: 'INTERNSHIP',
      salary: '₹25,000/month',
      description: 'A 6-month internship with high probability of a full-time offer.',
      deadline: new Date('2026-08-25'),
      minCgpa: 7.5, maxBacklogs: 0,
      allowedDepartments: ['Computer Science', 'Information Technology', 'Mathematics'],
      allowedPrograms: ['B.Tech', 'B.Sc'],
      requiredSkills: ['Python', 'SQL', 'Excel'],
      preferredSkills: ['Pandas', 'Power BI'],
    },
    {
      key: 'job-005',
      title: 'Cloud Infrastructure Engineer', company: 'CloudNative Inc.',
      location: 'Bengaluru, Karnataka', workMode: 'HYBRID', jobType: 'FULL_TIME',
      salary: '₹14–20 LPA',
      description: 'Build and maintain infrastructure powering mission-critical enterprise applications.',
      deadline: new Date('2026-09-15'),
      minCgpa: 8.0, maxBacklogs: 0,
      allowedDepartments: ['Computer Science', 'Information Technology'],
      allowedPrograms: ['B.Tech', 'M.Tech'],
      requiredSkills: ['AWS', 'Docker', 'Linux', 'Python'],
      preferredSkills: ['Kubernetes'],
    },
  ];

  const jobVersionIds: Record<string, string> = {};
  for (const jd of jobsData) {
    // Idempotent: reuse an existing job with the same title+company (latest version)
    const existingJob = await prisma.job.findFirst({
      where: {
        createdById: adminId,
        versions: { some: { title: jd.title, company: jd.company } },
      },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (existingJob && existingJob.versions.length > 0) {
      jobVersionIds[jd.key] = existingJob.versions[0].id;
      console.log(`    ✓ Job (existing): ${jd.title} @ ${jd.company}`);
      continue;
    }

    const job = await prisma.job.create({
      data: {
        createdById: adminId,
        status: 'PUBLISHED',
        versions: {
          create: {
            version: 1,
            title: jd.title, company: jd.company, location: jd.location,
            workMode: jd.workMode as any, jobType: jd.jobType as any,
            salary: jd.salary, description: jd.description, deadline: jd.deadline,
            minCgpa: jd.minCgpa, maxBacklogs: jd.maxBacklogs,
            allowedDepartments: jd.allowedDepartments,
            allowedPrograms: jd.allowedPrograms,
            publishedAt: new Date(),
            requirements: {
              create: [
                ...jd.requiredSkills.map((name) => ({
                  type: 'SOFT' as any,
                  skillId: skills[name] ?? null,
                  weight: 1.5,
                  required: true,
                  label: name,
                })),
                ...jd.preferredSkills.map((name) => ({
                  type: 'SOFT' as any,
                  skillId: skills[name] ?? null,
                  weight: 0.5,
                  required: false,
                  label: name,
                })),
              ],
            },
          },
        },
      },
      include: { versions: true },
    });
    jobVersionIds[jd.key] = job.versions[0].id;
    console.log(`    ✓ Job: ${jd.title} @ ${jd.company}`);
  }

  // ── 4. Sample Applications ──────────────────────────────────────
  console.log('  Creating sample applications…');
  const appData = [
    { studentRoll: '21CS001', jobKey: 'job-001', status: 'UNDER_REVIEW' as const },
    { studentRoll: '21CS001', jobKey: 'job-002', status: 'SHORTLISTED' as const },
    { studentRoll: '21CS001', jobKey: 'job-003', status: 'APPLIED' as const },
    { studentRoll: '21CS002', jobKey: 'job-001', status: 'SHORTLISTED' as const },
    { studentRoll: '21CS003', jobKey: 'job-001', status: 'UNDER_REVIEW' as const },
    { studentRoll: '21CS004', jobKey: 'job-003', status: 'SHORTLISTED' as const },
    { studentRoll: '21CS005', jobKey: 'job-004', status: 'UNDER_REVIEW' as const },
  ];

  for (const a of appData) {
    const studentId = studentIds[a.studentRoll];
    if (!studentId) continue;
    const job = await prisma.job.findFirst({ where: { versions: { some: { id: jobVersionIds[a.jobKey] } } } });
    if (!job) continue;

    await prisma.application.upsert({
      where: { studentId_jobId: { studentId, jobId: job.id } },
      update: { status: a.status },
      create: { studentId, jobId: job.id, status: a.status },
    });
  }
  console.log(`  ✓ ${appData.length} applications created`);

  // ── 5. Evaluations ──────────────────────────────────────────────
  // Generate real evaluations for every seeded application using the
  // deterministic matching / eligibility / skill-gap engines so the
  // demo shows live scores instead of empty fallbacks.
  console.log('  Generating evaluations with matching engine…');
  let evalCount = 0;

  for (const a of appData) {
    const studentId = studentIds[a.studentRoll];
    if (!studentId) continue;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { skillEvidence: { include: { skill: true } } },
    });
    if (!student) continue;

    const jobVersionId = jobVersionIds[a.jobKey];
    if (!jobVersionId) continue;

    const jobVersion = await prisma.jobVersion.findUnique({
      where: { id: jobVersionId },
      include: { requirements: { include: { skill: true } } },
    });
    if (!jobVersion) continue;

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

    const inputSnapshot = {
      studentId,
      jobVersionId,
      studentSkills: studentSkillInputs,
      jobRequirements: jobSkillRequirements.map((r) => ({
        id: r.id, name: r.name, weight: r.weight, required: r.required,
      })),
      snapshotAt: new Date().toISOString(),
    };
    // Hash excludes the timestamp so re-seeding with identical inputs is idempotent
    const hashBase = { ...inputSnapshot, snapshotAt: undefined };
    const snapshotHash = crypto.createHash('sha256').update(JSON.stringify(hashBase)).digest('hex');

    const existing = await prisma.evaluation.findFirst({ where: { snapshotHash } });
    if (existing) continue;

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

    const matchResult = computeMatch(studentSkillInputs, jobSkillRequirements);
    const gapResults = analyzeSkillGaps({
      studentSkills: studentSkillInputs,
      jobRequirements: jobSkillRequirements,
      matchDetails: matchResult.details,
    });

    const requiresReview = eligResult.status === 'CONDITIONAL' || matchResult.requiresReview;

    const evaluation = await prisma.evaluation.create({
      data: {
        studentId,
        jobVersionId,
        inputSnapshot: inputSnapshot as any,
        snapshotHash,
        status: requiresReview ? 'REVIEW_REQUIRED' : 'COMPLETED',
        eligibility: eligResult.status,
        overallScore: Math.round(matchResult.overallScore),
        confidenceScore: Math.round(matchResult.confidenceScore),
        coveragePercent: Math.round(matchResult.coveragePercent),
        matchSummary: matchResult.matchSummary,
        requiresReview,
        reviewNote: matchResult.reviewNote ?? (eligResult.failedRules.length > 0 ? eligResult.failedRules.join('; ') : null),
        requirementMatches: {
          create: matchResult.details.map((d) => ({
            requirementId: d.requirementId,
            skillId: null,
            matchState: d.status,
            contribution: d.contribution,
            explanation: d.explanation,
          })),
        },
        recommendations: {
          create: gapResults.map((r) => ({
            skillName: r.skillName,
            priority: r.priority,
            reason: r.reason,
            steps: r.steps,
            potentialLift: r.potentialLift ?? null,
            estimatedWeeks: r.estimatedWeeks ?? null,
          })),
        },
      },
    });

    evalCount++;
    console.log(
      `    ✓ Evaluation: ${student.rollNumber} × ${a.jobKey} → ${evaluation.overallScore}% (${evaluation.eligibility})`
    );
  }
  console.log(`  ✓ ${evalCount} evaluations created`);

  console.log('\n✅ Seed complete!');
  console.log('\nDemo credentials:');
  console.log('  Student: arjun.sharma@college.edu / student123');
  console.log('  Admin:   placement@college.edu / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
