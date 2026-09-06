/**
 * skillgap.engine.ts
 * Pure-function engine for generating actionable skill-gap analysis.
 * No external dependencies.
 */

import type {
  StudentSkillInput,
  JobSkillRequirement,
  SkillMatchDetail,
} from './matching.engine';

export type { StudentSkillInput, JobSkillRequirement, SkillMatchDetail };

export interface GapInput {
  studentSkills: StudentSkillInput[];
  jobRequirements: JobSkillRequirement[];
  matchDetails: SkillMatchDetail[];
}

export interface SkillGapResult {
  skillName: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  /** 3–5 ordered improvement steps */
  steps: string[];
  /** Estimated score-lift in points (0–30 scale) if gap is closed */
  potentialLift: number;
  /** Estimated weeks to close the gap */
  estimatedWeeks: number;
}

// ─── Skill category detection ─────────────────────────────────────────────────

type SkillCategory =
  | 'programming'
  | 'database'
  | 'cloud'
  | 'devops'
  | 'ml'
  | 'webfrontend'
  | 'webbackend'
  | 'mobile'
  | 'softskills'
  | 'testing'
  | 'security'
  | 'data'
  | 'general';

const CATEGORY_KEYWORDS: Record<SkillCategory, string[]> = {
  programming: [
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'golang', 'go',
    'rust', 'kotlin', 'swift', 'scala', 'ruby', 'php', 'perl', 'haskell',
    'programming', 'coding', 'algorithm', 'data structure',
  ],
  database: [
    'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'cassandra',
    'oracle', 'sqlite', 'nosql', 'database', 'db', 'dynamodb', 'elasticsearch',
  ],
  cloud: [
    'aws', 'azure', 'gcp', 'google cloud', 'cloud', 'lambda', 's3', 'ec2',
    'serverless', 'terraform', 'cloudformation',
  ],
  devops: [
    'docker', 'kubernetes', 'k8s', 'ci/cd', 'jenkins', 'gitlab', 'github actions',
    'ansible', 'puppet', 'chef', 'devops', 'helm', 'monitoring', 'prometheus',
    'grafana', 'nginx',
  ],
  ml: [
    'machine learning', 'deep learning', 'neural network', 'tensorflow', 'pytorch',
    'keras', 'scikit', 'nlp', 'computer vision', 'ai', 'artificial intelligence',
    'ml', 'model', 'training', 'inference', 'llm',
  ],
  webfrontend: [
    'react', 'angular', 'vue', 'svelte', 'html', 'css', 'sass', 'tailwind',
    'bootstrap', 'webpack', 'vite', 'frontend', 'ui', 'ux', 'responsive',
    'accessibility', 'next.js', 'nuxt',
  ],
  webbackend: [
    'node', 'express', 'fastapi', 'django', 'flask', 'spring', 'rails',
    'backend', 'rest', 'graphql', 'api', 'microservices', 'grpc', 'nestjs',
  ],
  mobile: [
    'android', 'ios', 'react native', 'flutter', 'mobile', 'swiftui', 'jetpack',
    'expo',
  ],
  softskills: [
    'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
    'time management', 'presentation', 'negotiation', 'collaboration',
  ],
  testing: [
    'testing', 'jest', 'pytest', 'junit', 'selenium', 'cypress', 'qa',
    'unit test', 'integration test', 'e2e', 'tdd', 'bdd',
  ],
  security: [
    'security', 'cybersecurity', 'owasp', 'penetration', 'encryption', 'oauth',
    'jwt', 'ssl', 'tls', 'vulnerability', 'firewall', 'siem',
  ],
  data: [
    'data analysis', 'data science', 'statistics', 'tableau', 'power bi',
    'pandas', 'numpy', 'excel', 'visualization', 'etl', 'pipeline', 'spark',
    'hadoop', 'bigquery', 'analytics',
  ],
  general: [],
};

function detectCategory(skillName: string): SkillCategory {
  const lower = skillName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [SkillCategory, string[]][]) {
    if (category === 'general') continue;
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return 'general';
}

// ─── Improvement step templates ───────────────────────────────────────────────

const STEP_TEMPLATES: Record<SkillCategory, string[]> = {
  programming: [
    'Complete a structured course on {skill} covering core syntax and idioms (e.g., official docs, Coursera, or Udemy).',
    'Solve 20–30 {skill} coding challenges on LeetCode, HackerRank, or Exercism to build fluency.',
    'Build a small end-to-end project (CLI tool or REST API) in {skill} and publish it on GitHub.',
    'Read and contribute to an open-source {skill} repository to understand real-world patterns.',
    'Review common {skill} interview questions and implement solutions from scratch.',
  ],
  database: [
    'Review foundational SQL/NoSQL concepts: schema design, indexing, normalization, and transactions.',
    'Practice 15+ {skill} query problems on Mode Analytics, SQLZoo, or a local database instance.',
    'Design and implement a sample database schema for a realistic domain (e.g., e-commerce, library).',
    'Explore advanced {skill} features such as stored procedures, views, or aggregation pipelines.',
    'Integrate {skill} with a backend application to understand connection pooling and ORM usage.',
  ],
  cloud: [
    'Obtain a foundational certification for {skill} (e.g., AWS Cloud Practitioner, AZ-900).',
    'Follow the official {skill} getting-started lab to deploy a simple web application.',
    'Experiment with core services (compute, storage, networking) through a free-tier account.',
    'Set up Infrastructure as Code (Terraform or CDK) to provision a {skill} environment.',
    'Complete a guided cloud project such as a serverless API or containerized microservice on {skill}.',
  ],
  devops: [
    'Learn the fundamentals of {skill} through official documentation and a hands-on lab.',
    'Containerize an existing application using Docker and orchestrate it with {skill}.',
    'Set up a CI/CD pipeline for a sample project using {skill} (build → test → deploy stages).',
    'Practice infrastructure-as-code principles by scripting environment provisioning with {skill}.',
    'Monitor a running service with {skill} metrics, alerts, and dashboards to understand observability.',
  ],
  ml: [
    'Study the mathematical foundations: linear algebra, probability, and calculus as applied to {skill}.',
    'Complete Andrew Ng\'s Machine Learning Specialization or fast.ai Practical Deep Learning course.',
    'Implement a baseline {skill} model on a public Kaggle dataset and document your approach.',
    'Experiment with pre-built libraries ({skill} frameworks) for classification, regression, or NLP tasks.',
    'Read 2–3 seminal papers related to {skill} and reproduce their key results in a notebook.',
  ],
  webfrontend: [
    'Build a responsive multi-page web app using {skill} to practice component architecture.',
    'Study state management patterns (Context, Redux, Zustand) as they apply to {skill} projects.',
    'Implement accessibility best practices (ARIA roles, keyboard navigation) in a {skill} project.',
    'Optimize a {skill} app for performance (code splitting, lazy loading, Lighthouse audit).',
    'Integrate a REST or GraphQL API into your {skill} app and handle loading/error states.',
  ],
  webbackend: [
    'Build a CRUD REST API with {skill}, including authentication (JWT/OAuth) and input validation.',
    'Add unit and integration tests to your {skill} API using an appropriate testing framework.',
    'Design a relational or document database schema and connect it to your {skill} application.',
    'Implement middleware for logging, rate limiting, and error handling in {skill}.',
    'Deploy your {skill} service to a cloud platform (Render, Railway, or AWS ECS).',
  ],
  mobile: [
    'Follow the official {skill} tutorial to build a to-do or weather app from scratch.',
    'Practice {skill} navigation patterns, state management, and async data fetching.',
    'Integrate a public REST API into a {skill} app and handle offline scenarios gracefully.',
    'Test your {skill} app on multiple screen sizes and device emulators.',
    'Publish your {skill} app to the relevant app store or share a working demo.',
  ],
  softskills: [
    'Join a public-speaking club (Toastmasters) or take a communication course related to {skill}.',
    'Practice {skill} through structured mock interviews or peer feedback sessions.',
    'Read a highly-rated book on {skill} (e.g., "Crucial Conversations", "The Leader\'s Handbook").',
    'Take on a project leadership role or volunteer to present in team stand-ups to build {skill}.',
    'Seek regular mentor feedback on your {skill} and track progress with a 30-day journal.',
  ],
  testing: [
    'Learn the fundamentals of {skill}: unit, integration, and end-to-end testing strategies.',
    'Write tests for an existing codebase using a {skill} framework (Jest, Pytest, JUnit, etc.).',
    'Practice TDD by writing failing tests first on a small feature, then making them pass.',
    'Set up a {skill} pipeline in CI to run tests automatically on each pull request.',
    'Explore code-coverage tools and aim to reach ≥80% coverage on a sample project.',
  ],
  security: [
    'Study the OWASP Top 10 vulnerabilities and how they apply to {skill} in web applications.',
    'Complete a CTF (Capture the Flag) challenge on platforms like HackTheBox or PicoCTF.',
    'Perform a security audit on a sample application: input validation, auth, dependency scanning.',
    'Learn secure coding practices for {skill}: parameterized queries, proper error handling, secrets management.',
    'Obtain a foundational security certification (CompTIA Security+) or complete a {skill} course.',
  ],
  data: [
    'Work through a {skill} end-to-end data project: collect, clean, analyze, and visualize a dataset.',
    'Learn and apply core statistical methods (hypothesis testing, correlation, regression) in {skill}.',
    'Practice {skill} with real datasets from Kaggle, UCI ML Repository, or government open data portals.',
    'Build an interactive dashboard or report using a {skill} visualization tool (Tableau, Power BI, Plotly).',
    'Document your {skill} analysis in a Jupyter Notebook or blog post to reinforce understanding.',
  ],
  general: [
    'Identify reputable learning resources for {skill} (official documentation, Coursera, Udemy, YouTube).',
    'Build a small hands-on project that directly uses {skill} to gain practical experience.',
    'Join communities, forums, or study groups focused on {skill} (Reddit, Discord, Stack Overflow).',
    'Find a mentor or peer who uses {skill} professionally and schedule regular knowledge-sharing sessions.',
    'Set a 4-week learning goal for {skill} with weekly milestones and track your progress.',
  ],
};

function getImprovementSteps(skillName: string): string[] {
  const category = detectCategory(skillName);
  const templates = STEP_TEMPLATES[category];
  // Replace {skill} placeholder with the actual skill name
  return templates.map((t) => t.replace(/\{skill\}/g, skillName));
}

// ─── Priority helpers ─────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<'high' | 'medium' | 'low', number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const ESTIMATED_WEEKS: Record<'high' | 'medium' | 'low', number> = {
  high: 5,
  medium: 3,
  low: 2,
};

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Analyzes skill gaps from match details and returns prioritized improvement recommendations.
 * Results are sorted by priority (high → low), then by potentialLift (desc).
 */
export function analyzeSkillGaps(input: GapInput): SkillGapResult[] {
  const { jobRequirements, matchDetails } = input;

  // Build a lookup map for requirements by id
  const reqById = new Map<string, JobSkillRequirement>();
  for (const req of jobRequirements) {
    reqById.set(req.id, req);
  }

  // Compute total weight across ALL requirements (for lift calculation)
  const totalWeight = jobRequirements.reduce((sum, r) => sum + r.weight, 0);
  const safeTotal = totalWeight > 0 ? totalWeight : 1; // prevent division by zero

  const results: SkillGapResult[] = [];

  for (const detail of matchDetails) {
    // Only process gaps (MISSING or PARTIAL)
    if (detail.status === 'STRONG') continue;

    const req = reqById.get(detail.requirementId);
    if (!req) continue;

    let priority: 'high' | 'medium' | 'low';
    let reason: string;
    let potentialLift: number;

    if (detail.status === 'MISSING') {
      if (req.required) {
        // Missing required skill
        priority = req.weight >= 1.5 ? 'high' : 'medium';
        reason =
          priority === 'high'
            ? `"${req.name}" is a high-weight required skill (weight: ${req.weight}) that is entirely absent from your profile.`
            : `"${req.name}" is a required skill that is missing from your profile.`;
        potentialLift = Math.ceil((req.weight / safeTotal) * 30);
      } else {
        // Missing preferred (non-required) skill
        priority = 'low';
        reason = `"${req.name}" is a preferred (non-required) skill not currently in your profile.`;
        potentialLift = Math.ceil((req.weight / safeTotal) * 15);
      }
    } else {
      // PARTIAL match
      priority = 'medium';
      reason = `"${req.name}" is partially matched — strengthening this skill will directly improve your overall score.`;
      potentialLift = Math.ceil((req.weight / safeTotal) * 15);
    }

    const steps = getImprovementSteps(req.name);
    const estimatedWeeks = ESTIMATED_WEEKS[priority];

    results.push({
      skillName: req.name,
      priority,
      reason,
      steps,
      potentialLift,
      estimatedWeeks,
    });
  }

  // Sort: priority desc, then potentialLift desc
  results.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.potentialLift - a.potentialLift;
  });

  return results;
}
