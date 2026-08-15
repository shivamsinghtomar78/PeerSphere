import type { MatchResult, SkillGap, Recommendation, Application, Candidate } from '@/types';
import { mockStudents } from './students';
import { mockJobs } from './jobs';

// ─── Match Results ────────────────────────────────────────────────
export const mockMatchResults: MatchResult[] = [
  {
    jobId: 'job-001',
    studentId: 'stu-001',
    overallScore: 72,
    confidenceScore: 88,
    eligibilityStatus: 'eligible',
    coveragePercent: 72,
    strongSkills: [
      { id: 'sk-java', name: 'Java', category: 'Programming', status: 'strong' },
      { id: 'sk-sql', name: 'SQL', category: 'Database', status: 'strong' },
      { id: 'sk-git', name: 'Git', category: 'Tools', status: 'strong' },
    ],
    partialSkills: [
      { id: 'sk-dsa', name: 'Data Structures & Algorithms', category: 'CS Fundamentals', status: 'partial', confidence: 72 },
    ],
    missingSkills: [
      { id: 'sk-spring', name: 'Spring Boot', category: 'Framework', status: 'missing' },
      { id: 'sk-restapi', name: 'REST API', category: 'Architecture', status: 'missing' },
    ],
    matchSummary: 'Strong foundation in Java and SQL. Key gaps in Spring Boot and REST API — both learnable with 4–6 weeks of focused effort.',
    analysisVersion: '2.1.0',
    generatedAt: '2026-08-14T18:00:00Z',
    requiresHumanReview: false,
  },
  {
    jobId: 'job-001',
    studentId: 'stu-002',
    overallScore: 94,
    confidenceScore: 96,
    eligibilityStatus: 'eligible',
    coveragePercent: 96,
    strongSkills: [
      { id: 'sk-java', name: 'Java', category: 'Programming', status: 'strong' },
      { id: 'sk-spring', name: 'Spring Boot', category: 'Framework', status: 'strong' },
      { id: 'sk-restapi', name: 'REST API', category: 'Architecture', status: 'strong' },
      { id: 'sk-sql', name: 'SQL', category: 'Database', status: 'strong' },
      { id: 'sk-dsa', name: 'Data Structures & Algorithms', category: 'CS Fundamentals', status: 'strong' },
    ],
    partialSkills: [],
    missingSkills: [],
    matchSummary: 'Excellent match across all required skills. Demonstrates strong practical experience with Spring Boot and REST API design.',
    analysisVersion: '2.1.0',
    generatedAt: '2026-08-14T18:00:00Z',
    requiresHumanReview: false,
  },
  {
    jobId: 'job-001',
    studentId: 'stu-003',
    overallScore: 48,
    confidenceScore: 76,
    eligibilityStatus: 'conditional',
    coveragePercent: 48,
    strongSkills: [
      { id: 'sk-java', name: 'Java', category: 'Programming', status: 'strong' },
      { id: 'sk-sql', name: 'MySQL', category: 'Database', status: 'strong' },
    ],
    partialSkills: [
      { id: 'sk-dsa', name: 'Data Structures & Algorithms', category: 'CS Fundamentals', status: 'partial', confidence: 50 },
    ],
    missingSkills: [
      { id: 'sk-spring', name: 'Spring Boot', category: 'Framework', status: 'missing' },
      { id: 'sk-restapi', name: 'REST API', category: 'Architecture', status: 'missing' },
      { id: 'sk-git', name: 'Git', category: 'Tools', status: 'missing' },
    ],
    matchSummary: 'Java and SQL are present but several required skills are missing. Significant upskilling needed before this role is within reach.',
    analysisVersion: '2.1.0',
    generatedAt: '2026-08-14T18:00:00Z',
    requiresHumanReview: true,
    humanReviewNote: 'Eligibility is conditional due to CGPA near threshold and active backlogs in previous record.',
  },
  {
    jobId: 'job-003',
    studentId: 'stu-004',
    overallScore: 91,
    confidenceScore: 94,
    eligibilityStatus: 'eligible',
    coveragePercent: 91,
    strongSkills: [
      { id: 'sk-react', name: 'React', category: 'Framework', status: 'strong' },
      { id: 'sk-typescript', name: 'TypeScript', category: 'Programming', status: 'strong' },
      { id: 'sk-nodejs', name: 'Node.js', category: 'Runtime', status: 'strong' },
      { id: 'sk-postgresql', name: 'PostgreSQL', category: 'Database', status: 'strong' },
    ],
    partialSkills: [],
    missingSkills: [
      { id: 'sk-docker', name: 'Docker', category: 'DevOps', status: 'missing' },
    ],
    matchSummary: 'Outstanding full-stack profile. React, TypeScript, Node.js, and PostgreSQL are all strong. Only Docker is missing — a straightforward addition.',
    analysisVersion: '2.1.0',
    generatedAt: '2026-08-14T18:00:00Z',
    requiresHumanReview: false,
  },
  {
    jobId: 'job-004',
    studentId: 'stu-005',
    overallScore: 68,
    confidenceScore: 78,
    eligibilityStatus: 'conditional',
    coveragePercent: 68,
    strongSkills: [
      { id: 'sk-python', name: 'Python', category: 'Programming', status: 'strong' },
      { id: 'sk-sql', name: 'SQL', category: 'Database', status: 'strong' },
    ],
    partialSkills: [],
    missingSkills: [
      { id: 'sk-excel', name: 'Excel/Spreadsheets', category: 'Tools', status: 'missing' },
      { id: 'sk-pandas', name: 'Pandas', category: 'Library', status: 'missing' },
    ],
    matchSummary: 'Solid Python and SQL foundation. Missing Excel/Spreadsheets and Pandas which are core to data analyst workflows. Conditional due to active backlog.',
    analysisVersion: '2.1.0',
    generatedAt: '2026-08-14T18:00:00Z',
    requiresHumanReview: true,
    humanReviewNote: 'Eligibility is conditional due to 1 active backlog.',
  },
];

// ─── Skill Gaps (for stu-001 / Arjun) ────────────────────────────
export const mockSkillGaps: SkillGap[] = [
  {
    skill: { id: 'sk-spring', name: 'Spring Boot', category: 'Framework' },
    priority: 'high',
    reason: 'Required in 4 of 5 top-matched jobs. Missing from current resume.',
    recommendation: 'Build a Spring Boot REST API project and add it to your resume.',
    steps: [
      'Complete the Spring Boot fundamentals course (2 weeks)',
      'Build a CRUD REST API with Spring Boot',
      'Add JWT authentication to the project',
      'Connect to a PostgreSQL database using JPA',
      'Deploy to a free cloud platform and add project link to resume',
    ],
    potentialMatchImprovement: 14,
  },
  {
    skill: { id: 'sk-restapi', name: 'REST API Design', category: 'Architecture' },
    priority: 'high',
    reason: 'Required alongside Spring Boot in backend roles. Closely related to your Spring Boot gap.',
    recommendation: 'REST API principles are learned best while building the Spring Boot project above.',
    steps: [
      'Study RESTful principles: resources, verbs, status codes',
      'Implement CRUD operations following REST conventions',
      'Document your API with Swagger/OpenAPI',
      'Add versioning and error handling',
    ],
    potentialMatchImprovement: 8,
  },
  {
    skill: { id: 'sk-dsa', name: 'Data Structures & Algorithms', category: 'CS Fundamentals' },
    priority: 'medium',
    reason: 'Partially present — basic knowledge detected but interview-level depth is lacking.',
    recommendation: 'Solve 2–3 LeetCode problems daily focusing on arrays, trees, and graphs.',
    steps: [
      'Revise time/space complexity analysis',
      'Complete 30 medium-level LeetCode problems',
      'Focus on: Arrays, Linked Lists, Binary Trees, Graphs, DP',
      'Practice mock interviews on Pramp or Interviewing.io',
    ],
    potentialMatchImprovement: 6,
  },
  {
    skill: { id: 'sk-docker', name: 'Docker', category: 'DevOps' },
    priority: 'low',
    reason: 'Preferred (not required) in 2 target jobs. Good-to-have for modern backend roles.',
    recommendation: 'Containerize your Spring Boot project with Docker to demonstrate DevOps awareness.',
    steps: [
      'Learn Docker fundamentals (containers, images, volumes)',
      'Write a Dockerfile for your Spring Boot app',
      'Set up Docker Compose for local development',
    ],
    potentialMatchImprovement: 3,
  },
];

// ─── Recommendations (for stu-001) ───────────────────────────────
export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec-001',
    studentId: 'stu-001',
    jobId: 'job-001',
    skill: { id: 'sk-spring', name: 'Spring Boot', category: 'Framework' },
    priority: 'high',
    currentMatchScore: 72,
    projectedMatchScore: 86,
    estimatedTimeWeeks: 5,
    steps: [
      'Complete Spring Boot fundamentals course',
      'Build a CRUD REST API project',
      'Add authentication (JWT)',
      'Connect to SQL database with JPA/Hibernate',
      'Deploy project and link on resume',
    ],
    resources: [
      { title: 'Spring Boot Official Guide', type: 'documentation' },
      { title: 'Build a REST API with Spring Boot', type: 'course' },
      { title: 'Pet Clinic Sample Project', type: 'project' },
    ],
  },
  {
    id: 'rec-002',
    studentId: 'stu-001',
    skill: { id: 'sk-dsa', name: 'Data Structures & Algorithms', category: 'CS Fundamentals' },
    priority: 'medium',
    currentMatchScore: 72,
    projectedMatchScore: 78,
    estimatedTimeWeeks: 6,
    steps: [
      'Review complexity analysis',
      'Solve 30 medium LeetCode problems',
      'Complete arrays, trees, and graphs tracks',
      'Practice 5 timed mock interview sessions',
    ],
    resources: [
      { title: 'LeetCode 75 Study Plan', type: 'practice' },
      { title: 'Neetcode Roadmap', type: 'course' },
    ],
  },
];

// ─── Applications (for stu-001) ───────────────────────────────────
export const mockApplications: Application[] = [
  {
    id: 'app-001',
    studentId: 'stu-001',
    jobId: 'job-001',
    status: 'under_review',
    appliedAt: '2026-08-05T10:30:00Z',
    updatedAt: '2026-08-07T14:00:00Z',
    matchResult: mockMatchResults[0],
  },
  {
    id: 'app-002',
    studentId: 'stu-001',
    jobId: 'job-002',
    status: 'shortlisted',
    appliedAt: '2026-08-06T09:00:00Z',
    updatedAt: '2026-08-10T11:30:00Z',
  },
  {
    id: 'app-003',
    studentId: 'stu-001',
    jobId: 'job-003',
    status: 'applied',
    appliedAt: '2026-08-09T16:00:00Z',
    updatedAt: '2026-08-09T16:00:00Z',
  },
  {
    id: 'app-004',
    studentId: 'stu-004',
    jobId: 'job-003',
    status: 'shortlisted',
    appliedAt: '2026-08-07T00:00:00Z',
    updatedAt: '2026-08-11T00:00:00Z',
  },
  {
    id: 'app-005',
    studentId: 'stu-005',
    jobId: 'job-004',
    status: 'under_review',
    appliedAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
];

// ─── Candidates (for placement officer view — job-001) ─────────────
export const mockCandidates: Candidate[] = [
  {
    student: mockStudents[1], // Priya
    application: {
      id: 'app-101',
      studentId: 'stu-002',
      jobId: 'job-001',
      status: 'shortlisted',
      appliedAt: '2026-08-04T08:00:00Z',
      updatedAt: '2026-08-12T10:00:00Z',
    },
    matchResult: mockMatchResults[1],
    rank: 1,
    isShortlisted: true,
    shortlistedAt: '2026-08-12T10:00:00Z',
    reviewedBy: 'Placement Officer',
  },
  {
    student: mockStudents[0], // Arjun
    application: mockApplications[0],
    matchResult: mockMatchResults[0],
    rank: 2,
    isShortlisted: false,
  },
  {
    student: mockStudents[2], // Rohan
    application: {
      id: 'app-102',
      studentId: 'stu-003',
      jobId: 'job-001',
      status: 'under_review',
      appliedAt: '2026-08-06T11:00:00Z',
      updatedAt: '2026-08-08T09:00:00Z',
    },
    matchResult: mockMatchResults[2],
    rank: 3,
    isShortlisted: false,
  },
  {
    student: mockStudents[3], // Anika
    application: {
      id: 'app-004',
      studentId: 'stu-004',
      jobId: 'job-003',
      status: 'shortlisted',
      appliedAt: '2026-08-07T00:00:00Z',
      updatedAt: '2026-08-11T00:00:00Z',
    },
    matchResult: mockMatchResults[3],
    rank: 4,
    isShortlisted: true,
    shortlistedAt: '2026-08-11T00:00:00Z',
    reviewedBy: 'Placement Officer',
  },
  {
    student: mockStudents[4], // Vikram
    application: {
      id: 'app-005',
      studentId: 'stu-005',
      jobId: 'job-004',
      status: 'under_review',
      appliedAt: '2026-08-10T00:00:00Z',
      updatedAt: '2026-08-10T00:00:00Z',
    },
    matchResult: mockMatchResults[4],
    rank: 5,
    isShortlisted: false,
  },
];

// ─── Placement Stats ──────────────────────────────────────────────
export const mockPlacementStats = {
  totalStudents: 156,
  activeJobs: 12,
  totalApplications: 384,
  eligibleCandidates: 98,
  shortlisted: 34,
  offersExtended: 18,
  offersAccepted: 15,
  placementRate: 9.6, // percent
  avgMatchScore: 74,
  avgConfidence: 81,
};

export const mockSkillGapDistribution = [
  { skill: 'Spring Boot', affectedStudents: 112, priority: 'high' as const },
  { skill: 'REST API Design', affectedStudents: 98, priority: 'high' as const },
  { skill: 'DSA (Intermediate)', affectedStudents: 87, priority: 'medium' as const },
  { skill: 'Docker', affectedStudents: 134, priority: 'low' as const },
  { skill: 'System Design', affectedStudents: 76, priority: 'medium' as const },
  { skill: 'Cloud (AWS/GCP)', affectedStudents: 128, priority: 'low' as const },
];
