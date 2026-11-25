# PeerSphere — Comprehensive Viva Question Bank (105 Questions & Answers)

Organized into 8 categories (A–H) from basic to advanced, grounded strictly in the PeerSphere source code.

---

## Category A: Basic Project Questions (1–12)

**Q1. What is PeerSphere?**  
**A:** PeerSphere is a unified full-stack campus placement matching and skill-gap analysis platform built with Next.js 16, React 19, TypeScript, Prisma ORM, and PostgreSQL 16. It serves two roles: Students (`STUDENT`) and Placement Officers (`PLACEMENT_ADMIN`).

**Q2. Why did you choose this project?**  
**A:** As 7th-semester B.Tech CSE-AI students, we saw that campus placement screening relies on error-prone spreadsheets, while black-box AI screeners give unexplainable scores. We wanted to build an explainable, auditable system that also guides students on what skills to learn next.

**Q3. What real-world problem does PeerSphere solve?**  
**A:** It automates multi-rule eligibility checks (CGPA, backlogs, branch, program), replaces opaque resume scores with traceable per-skill match breakdowns, gives students prioritized skill-gap roadmaps, and provides placement officers with an append-only audit trail for overrides.

**Q4. What is the main objective of PeerSphere?**  
**A:** To provide deterministic, zero-hallucination candidate-to-job matching with 100% score explainability, actionable upskilling roadmaps, and human-in-the-loop placement governance.

**Q5. Who are the target users of the system?**  
**A:** University students preparing for campus drives (`STUDENT`) and Training & Placement cell officers/coordinators (`PLACEMENT_ADMIN`).

**Q6. What are the key features for Students?**  
**A:** Bento placement readiness dashboard, job discovery, instant eligibility and match evaluation, prioritized skill-gap roadmaps, manual skill management, PDF resume upload/versioning/download, and application status tracking.

**Q7. What are the key features for Placement Officers?**  
**A:** Versioned job creation and publishing, ranked candidate matrices per drive, side-by-side candidate comparison (`/placement/compare`), append-only review overrides with mandatory reasons, cohort skill-gap analytics, live database reports with CSV export, and audit log inspection.

**Q8. What does "Explainable. Never black-box." mean in PeerSphere?**  
**A:** Every overall match score (`0–100`) decomposes into individual `RequirementMatch` rows (`STRONG`, `PARTIAL`, `MISSING`) with numeric contributions (`1.0`, `0.5`, `0.0`) and human-readable explanations, plus pass/fail eligibility rules.

**Q9. How is PeerSphere different from generic job portals like Naukri or LinkedIn?**  
**A:** Generic portals do not enforce institutional rules like CGPA cutoffs, active backlog limits, or allowed degree programs, nor do they generate weighted skill-gap learning roadmaps or audited placement officer overrides.

**Q10. Is PeerSphere a microservices architecture or a monolith?**  
**A:** It is a **unified full-stack Next.js 16 application** (modular monolith) where frontend pages, `/api/v1/*` route handlers, domain services, and pure matching engines live in one codebase and deploy as a single unit.

**Q11. What is the current version and seed state of the project?**  
**A:** Version `1.0.0` (`package.json`). `prisma/seed.ts` seeds 20 canonical skills, 6 users (5 students + 1 placement admin), 5 jobs, 7 applications, and 7 engine-generated evaluations.

**Q12. Does PeerSphere support dark mode and PWA installation?**  
**A:** Yes. `lib/theme-context.tsx` supports `light`, `dark`, and `system` themes via `data-theme`, and `app/manifest.ts` + `public/sw.js` (`RegisterSW`) provide PWA capabilities.

---

## Category B: Application Workflow (13–24)

**Q13. Explain the complete end-to-end workflow of a placement drive.**  
**A:** A Placement Officer creates a `Job` (`DRAFT`) with `JobVersion` v1 and `JobRequirement`s, then publishes it (`POST /api/v1/jobs/[id]/publish`). Students view published jobs, queue an evaluation (`POST /api/v1/evaluations/queue`) to check eligibility and skill match, review skill-gap roadmaps, and apply (`POST /api/v1/jobs/[id]/apply`). The officer then reviews ranked candidates, optionally records an override (`POST /api/v1/evaluations/[id]/override`), and transitions application statuses.

**Q14. What happens step-by-step when a student clicks "Run Match Analysis" / queues an evaluation?**  
**A:** The frontend calls `queueEvaluation()` → `POST /api/v1/evaluations/queue`. `proxy.ts` verifies the JWT and injects `x-user-id`. The service fetches the latest published `JobVersion` and the student's `StudentSkillEvidence`, computes a SHA-256 `snapshotHash`, checks for an existing evaluation (idempotency), and if none exists, runs `checkEligibility()`, `computeMatch()`, and `analyzeSkillGaps()`, saving `Evaluation`, `RequirementMatch`, and `Recommendation` records.

**Q15. What happens when a student applies to a job?**  
**A:** `POST /api/v1/jobs/[jobId]/apply` checks that the job is `PUBLISHED`, verifies the deadline has not passed (`422` if expired), runs eligibility checks (`422` if `INELIGIBLE`), checks for duplicate application (`studentId_jobId`), and runs a `prisma.$transaction` to create the `Application` (`APPLIED`) and increment `JobVersion.applicationCount`.

**Q16. What happens if an API request fails with `401 Unauthorized` due to an expired access token?**  
**A:** The Axios response interceptor in `lib/api-client.ts` catches the `401`, sets `isRefreshing = true`, queues any concurrent failing requests in `failedQueue`, calls `POST /api/v1/auth/refresh` with the `refreshToken`, stores the new tokens, and retries all queued requests. If refresh fails, it clears `localStorage` and redirects to `/auth`.

**Q17. How does a Placement Officer override an AI evaluation?**  
**A:** On `/placement/candidates/[id]`, the officer chooses `shortlist`, `reject`, `review`, or `promote` and provides a mandatory written `reason`. `POST /api/v1/evaluations/[evaluationId]/override` executes a transaction that inserts a `ReviewOverride` row and an `AuditEvent` (`EVALUATION_OVERRIDE`) without modifying the original `Evaluation`.

**Q18. How is `profileCompleteness` calculated for a student?**  
**A:** In `lib/services/students.service.ts:recalculateCompleteness()`, it checks if `name`, `cgpa`, `department`, `program`, `activeBacklogs`, at least 1 `StudentSkillEvidence`, and at least 1 non-deleted `ResumeVersion` are present—setting `100` if all are true, else `0`.

**Q19. Can a student edit their own CGPA or backlog count?**  
**A:** No. `updateMyProfile()` in `lib/services/students.service.ts` explicitly restricts student self-edits to `name` only; academic fields (`cgpa`, `activeBacklogs`, `department`) are managed administratively.

**Q20. How does the application status state machine work?**  
**A:** `lib/services/applications.service.ts` defines `VALID_TRANSITIONS`. For example, `APPLIED` can move to `UNDER_REVIEW`, `SHORTLISTED`, `REJECTED`, or `WITHDRAWN`, while `OFFER_ACCEPTED`, `REJECTED`, and `WITHDRAWN` are terminal states (`[]`). Invalid jumps throw `409 CONFLICT`.

**Q21. Can a student withdraw their own application?**  
**A:** Yes, `STUDENT_ALLOWED_TARGET_STATUSES` permits `WITHDRAWN` for students, while full status transitions are restricted to `PLACEMENT_ADMIN`.

**Q22. How does resume download work securely if the API requires a Bearer token?**  
**A:** A plain `<a href>` cannot send an `Authorization` header. Therefore, `services/student-api.ts:downloadMyResume()` fetches the PDF as a `Blob` via `apiClient`, creates a temporary `URL.createObjectURL(blob)`, triggers a programmatic link click, and revokes the URL.

**Q23. What happens when a Placement Officer edits a `DRAFT` job?**  
**A:** `updateJob()` in `lib/services/jobs.service.ts` only allows editing jobs in `DRAFT` status and creates a new `JobVersion` (`version: prev.version + 1`) rather than overwriting the previous version.

**Q24. How are live reports generated and exported?**  
**A:** `GET /api/v1/reports/[id]` calls `analyticsService.generateReport(id)`, which queries live PostgreSQL counts/aggregates for 6 report types and returns structured sections. The frontend (`downloadReportCsv` in `services/placement-api.ts`) formats these rows into a UTF-8 BOM CSV file for Excel.

---

## Category C: Technology Stack (25–36)

**Q25. Why did you choose Next.js 16 (App Router) instead of a separate React + Express backend?**  
**A:** A unified Next.js 16 app eliminates CORS configuration, shares TypeScript types directly between frontend and backend, supports Server/Client components, and simplifies deployment into a single Docker container or serverless target.

**Q26. Why did you choose PostgreSQL over MongoDB?**  
**A:** Placement data is highly relational (Users → Students → Skills, Jobs → JobVersions → JobRequirements, Evaluations → RequirementMatches → Overrides) and requires ACID transactions (`prisma.$transaction`) for atomic operations like applying, publishing, and auditing.

**Q27. Why did you use Prisma ORM?**  
**A:** Prisma provides a declarative schema (`prisma/schema.prisma`), auto-generated TypeScript types, safe parameterized queries (preventing SQL injection), and clean migration management (`prisma migrate deploy`).

**Q28. Why did you use `bcryptjs` instead of plain SHA-256 for passwords?**  
**A:** SHA-256 is fast and vulnerable to GPU brute-forcing. `bcryptjs` is a slow, salted adaptive hashing function (cost factor 10 in `seed.ts`) designed specifically for password storage.

**Q29. Why did you implement JWT using Web Crypto API (`crypto.subtle`) instead of the `jsonwebtoken` npm package?**  
**A:** Next.js `proxy.ts` (middleware) runs in the Edge runtime, which does not support Node.js native `crypto` modules required by `jsonwebtoken`. Web Crypto works identically in both Edge and Node.js runtimes.

**Q30. Why did you use Zod for validation?**  
**A:** Zod validates incoming JSON payloads at runtime (e.g., `loginSchema`, `queueEvaluationSchema`, `createOverrideSchema`) and infers static TypeScript types, returning structured field-level `400 BAD_REQUEST` errors on failure.

**Q31. Why did you use Axios (`lib/api-client.ts`) instead of native `fetch`?**  
**A:** Axios provides built-in request/response interceptors, making it clean to attach `Authorization: Bearer` headers globally and implement the `401` token-refresh queue (`failedQueue`).

**Q32. What is Neon PostgreSQL and why is `-pooler` used in `DATABASE_URL`?**  
**A:** Neon is a serverless PostgreSQL 16 provider. In serverless/Next.js environments, many short-lived connections can exhaust Postgres connection limits, so Neon's `-pooler` endpoint (PgBouncer) pools connections efficiently.

**Q33. What charting and UI libraries are used?**  
**A:** Tailwind CSS v4 with custom CSS design tokens (`styles/tokens.css`, `glass.css`, `clay.css`), `lucide-react` for icons, `framer-motion` for animations, and `recharts` for analytics charts.

**Q34. What are the advantages of your tech stack?**  
**A:** End-to-end TypeScript safety, zero-hallucination deterministic engines, ACID database guarantees, Edge-compatible auth, and single-container deployment.

**Q35. What are the disadvantages/trade-offs of your tech stack?**  
**A:** The in-memory rate limiter (`lib/auth/rate-limit.ts`) does not share state across multiple server instances, and local disk resume storage (`UPLOAD_DIR`) requires a persistent volume or migration to S3/Tigris for multi-node scaling.

**Q36. Why is `output: 'standalone'` conditionally enabled in `next.config.js`?**  
**A:** Docker builds consume Next.js's minimal `.next/standalone` bundle (`CMD ["node", "server.js"]`), whereas Vercel uses its own serverless adapter and fails if `standalone` is set.

---

## Category D: Programming & Source Code (37–52)

**Q37. What is `proxy.ts` in Next.js 16?**  
**A:** Next.js 16 renamed `middleware.ts` to `proxy.ts`. It matches `/api/v1/:path*`, strips any client-supplied `x-user-id` and `x-user-role` headers, verifies the Bearer JWT (except on `PUBLIC_ROUTES`), and injects verified `x-user-id` and `x-user-role` headers.

**Q38. How does `getAuthUser(request)` work in `lib/auth/request.ts`?**  
**A:** It reads `x-user-id` and `x-user-role` from the request headers (which only `proxy.ts` can set) and validates that the role is `'STUDENT'` or `'PLACEMENT_ADMIN'`.

**Q39. Explain the `ApiError` class and `isApiError()` in `lib/errors/api-error.ts`.**  
**A:** `ApiError` extends `Error` with `statusCode`, `code`, and optional `details`. `isApiError()` checks `instanceof ApiError` plus a structural fallback (`name === 'ApiError'` and numeric `statusCode`) so errors are still caught accurately even if Next.js bundles a route and service into separate chunks.

**Q40. How are API responses standardized?**  
**A:** `lib/api/response.ts` wraps all responses in `{ success: true, data, requestId }` (`successResponse`) or `{ success: false, error: { code, message, details }, requestId }` (`errorResponse`).

**Q41. How does `ThemeProvider` in `lib/theme-context.tsx` avoid React hydration mismatches?**  
**A:** It uses `React.useSyncExternalStore` (`useHydrated`) so server renders default safely until client hydration completes, while reading `ps-theme` from `localStorage` and setting `data-theme` on `document.documentElement`.

**Q42. How does `ProtectedRouteWithRole` work in `components/auth/ProtectedRoute.tsx`?**  
**A:** It consumes `useAuth()`. If `!isAuthenticated`, it redirects to `/auth`. If authenticated but `user.role` is not in the allowed `role` prop, it renders an "Access Denied" card and redirects.

**Q43. Explain the `failedQueue` pattern in `lib/api-client.ts`.**  
**A:** When multiple parallel API calls fail with `401` simultaneously, only the first triggers `/auth/refresh` (`isRefreshing = true`). Subsequent `401` calls push `{ resolve, reject }` promises into `failedQueue`. Once the refresh succeeds, `processQueue(null, accessToken)` resolves and retries all queued requests.

**Q44. Why does `listJobs()` in `lib/services/jobs.service.ts` use `prisma.application.groupBy` instead of reading `JobVersion.applicationCount`?**  
**A:** As noted in the source comments, denormalized counters on `JobVersion` can drift during seeding or status changes, so `listJobs()` computes live counts via `groupBy` on `Application`.

**Q45. How does `evaluations.service.ts` ensure idempotency?**  
**A:** Before running the engines, `queueEvaluation()` builds `inputSnapshot` (studentId, jobVersionId, skills, requirements), strips `snapshotAt`, hashes it with SHA-256 (`snapshotHash`), and checks `prisma.evaluation.findFirst({ where: { snapshotHash } })`. If found, it returns the existing evaluation.

**Q46. What is the role of `types/api.ts` and the mapper functions?**  
**A:** `types/api.ts` defines backend DTO types (`BackendStudent`, `BackendJob`, `BackendEvaluation`) and mapper functions (`mapBackendEvaluationToMatchResult`, `mapBackendJobToFrontend`, etc.) so UI components receive consistent normalized frontend types.

**Q47. Why are `lib/engines/*.ts` written as pure functions?**  
**A:** Pure functions have no database or network side effects, making them deterministic, easy to reason about, fast to execute, and trivial to unit-test with Jest.

**Q48. How does `findOrCreateSkill()` in `jobs.service.ts` avoid race conditions?**  
**A:** It uses `prisma.skill.upsert({ where: { canonicalName: name.trim() }, ... })` so concurrent job-creation requests never fail on the unique constraint.

**Q49. How does `extractSkillGapsFromEvaluations()` in `services/student-api.ts` prevent duplicate skill cards?**  
**A:** A student may miss the same skill (e.g., Docker) across multiple job evaluations. The function deduplicates by skill name (case-insensitive) and keeps the occurrence with the highest `potentialMatchImprovement` and `priority`.

**Q50. What does `next.config.js` configure for security and builds?**  
**A:** It sets `X-DNS-Prefetch-Control`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `typescript.ignoreBuildErrors: false`, SVGR webpack loader, and conditional `output: 'standalone'`.

**Q51. How does `AuthContext` manage global authentication state?**  
**A:** `AuthProvider` in `app/layout.tsx` wraps the app, initializes auth from `localStorage` via `lib/auth.ts`, and exposes `user`, `isAuthenticated`, `isLoading`, `error`, `login`, `logout`, and `clearError` through `useAuth()`.

**Q52. Why is `/* turbopackIgnore: true */` used in `lib/services/resumes.service.ts`?**  
**A:** It prevents Next.js 16 Turbopack's build-output file tracer from bundling the runtime `UPLOAD_DIR` directory into the build output.

---

## Category E: Database & APIs (53–68)

**Q53. How many models and enums are in `prisma/schema.prisma`?**  
**A:** 14 models (`User`, `Student`, `Skill`, `StudentSkillEvidence`, `ResumeVersion`, `Job`, `JobVersion`, `JobRequirement`, `Evaluation`, `RequirementMatch`, `Recommendation`, `Application`, `ReviewOverride`, `AuditEvent`) and 11 enums.

**Q54. Why are `Job` and `JobVersion` separate tables?**  
**A:** When a job's requirements or CGPA rules are edited, creating a new `JobVersion` (`@@unique([jobId, version])`) preserves historical `Evaluation` records linked to the exact `jobVersionId` they were evaluated against.

**Q55. What indexes exist on `Evaluation` and why?**  
**A:** `@@index([studentId, createdAt])` for student evaluation history, `@@index([jobVersionId, overallScore])` for ranking candidates per drive, and `@@index([snapshotHash])` for fast idempotency lookups.

**Q56. What indexes exist on `Application` and `AuditEvent`?**  
**A:** `Application` has `@@unique([studentId, jobId])`, `@@index([jobId, status])`, and `@@index([status, appliedAt])`. `AuditEvent` has `@@index([resourceType, resourceId, createdAt])` and `@@index([createdAt])`.

**Q57. What happens when a `Student` is deleted?**  
**A:** `ResumeVersion` and `StudentSkillEvidence` have `onDelete: Cascade` from `Student`, and `Student` has `onDelete: Cascade` from `User`. `Evaluation` and `Application` do not cascade-delete so historical records remain intact.

**Q58. How are `Skill` aliases stored and used?**  
**A:** `Skill.aliases` is a PostgreSQL `String[]` array (e.g., `["Postgres", "PG"]` for `PostgreSQL`). `matching.engine.ts` checks `reqAliases.includes(skillName)` during evaluation.

**Q59. What is `inputSnapshot` in `Evaluation`?**  
**A:** A `Json` column storing the exact `studentId`, `jobVersionId`, `studentSkills`, `jobRequirements`, and `snapshotAt` timestamp used at evaluation time for auditability.

**Q60. Why are `ReviewOverride` and `AuditEvent` called "append-only"?**  
**A:** There are no `UPDATE` or `DELETE` endpoints or service methods for them—new actions only `CREATE` new timestamped rows, preserving a complete historical trail.

**Q61. Which `/api/v1/*` routes are public?**  
**A:** Only 3 exact `(path, method)` pairs in `proxy.ts`: `POST /api/v1/auth`, `POST /api/v1/auth/refresh`, and `GET /api/v1/jobs`. Note that `GET /api/v1/jobs` still optionally parses a valid token so admins can see `DRAFT` jobs while unauthenticated/student users only see `PUBLISHED` jobs.

**Q62. Explain the difference between `400`, `401`, `403`, `404`, `409`, `422`, and `429` in your API.**  
**A:** `400` = Zod validation/bad request; `401` = missing/invalid JWT; `403` = valid JWT but wrong role/ownership; `404` = resource not found; `409` = conflict (duplicate skill, already published/closed, invalid status transition); `422` = unprocessable (ineligible student or expired deadline); `429` = rate limited.

**Q63. How does `GET /api/v1/analytics/skill-gaps` avoid double-counting?**  
**A:** In `analytics.service.ts:getSkillGaps()`, it tracks a `Set<string>` of distinct `studentId`s per `skillId` so a student missing "Docker" on 3 different jobs is only counted once in cohort skill-gap statistics.

**Q64. How is `getSkillPriority` calculated in cohort analytics?**  
**A:** Relative to `totalStudents`: `>= 50%` missing → `'high'`, `>= 25%` → `'medium'`, `< 25%` → `'low'`.

**Q65. What is `algorithmVersion` in `Evaluation`?**  
**A:** A string field defaulting to `"2.1.0"` that records which version of the matching engine produced the score.

**Q66. How does `GET /api/v1/students` support search and pagination?**  
**A:** `listStudents()` accepts `page`, `pageSize`, `department` (case-insensitive `contains`), and `search` (matching `name`, `rollNumber`, or `user.email`) and returns `{ items, total, page, pageSize, hasNext }`.

**Q67. How are `JobRequirement` weights set when creating a job?**  
**A:** In `jobs.service.ts:createJob()`, `requiredSkills` are created as `type: 'HARD'`, `required: true`, `weight: 1.0`, and `preferredSkills` as `type: 'SOFT'`, `required: false`, `weight: 0.5`.

**Q68. What happens if `prisma.resumeVersion` is deleted by a student?**  
**A:** `resumes.service.ts:deleteResume()` performs a **soft delete** by setting `deletedAt = new Date()` and `state = 'DELETED'`, then recalculates `profileCompleteness` if no active resumes remain.

---

## Category F: AI/ML & Core Algorithms (69–82)

**Q69. Does PeerSphere use an external LLM like OpenAI or Gemini API?**  
**A:** No. In the current implementation, PeerSphere uses **deterministic, rule-based pure TypeScript engines** (`eligibility.engine.ts`, `matching.engine.ts`, `skillgap.engine.ts`) rather than external LLMs, ensuring zero hallucinations, zero API cost, and 100% reproducibility.

**Q70. Why did you choose a deterministic rule-based/taxonomy engine over an LLM for a CSE-AI project?**  
**A:** In high-stakes placement decisions, Explainable AI (XAI) and determinism are critical. An LLM can output different scores for the same resume on two runs or hallucinate skills. Our symbolic taxonomy + weighted scoring + confidence gating guarantees every point is mathematically traceable.

**Q71. Explain the 3-tier skill matching algorithm in `computeMatch()`.**  
**A:** `findBestMatch()` checks: (1) Exact normalized name match, (2) Alias match against `Skill.aliases[]`, and (3) Substring overlap fallback. Exact/alias matches with `confidence >= 75` score `STRONG` (`1.0`); exact/alias with `confidence >= 40` or substring matches score `PARTIAL` (`0.5`); below `40` or no match scores `MISSING` (`0.0`).

**Q72. How is `overallScore` calculated in `matching.engine.ts`?**  
**A:** Only `required === true` skills contribute to `overallScore`: `Math.round((weightedScoreNumerator / weightedScoreDenominator) * 100)`, where `contribution` is `1.0`, `0.5`, or `0.0`. If there are no required skills, it defaults to `100`.

**Q73. How is `confidenceScore` calculated?**  
**A:** It is the weighted average of matched skills' `confidence` values (`confidenceWeightedSum / confidenceWeightTotal`), clamped to `0–100` (defaults to `85` if matched skills lack confidence weights, or `0` if none matched).

**Q74. How is `coveragePercent` calculated?**  
**A:** `Math.round((requiredMatched / requiredTotal) * 100)`, where `requiredMatched` counts required skills that are either `STRONG` or `PARTIAL`.

**Q75. When is `requiresReview` set to `true`?**  
**A:** In `matching.engine.ts`, `requiresReview` is `true` if `confidenceScore < 60` or `hasConflictingAliases(req)` detects duplicate normalized tokens. In `evaluations.service.ts`, it is also `true` if `eligResult.status === 'CONDITIONAL'`.

**Q76. Explain the 4 eligibility statuses in `eligibility.engine.ts`.**  
**A:** `INELIGIBLE` (one or more hard rules failed: CGPA, backlogs, department, or program), `PENDING` (CGPA is `null` and no other rules failed), `CONDITIONAL` (no hard failures, soft conditions exist), and `ELIGIBLE` (all checks passed).

**Q77. How does `analyzeSkillGaps()` calculate `potentialLift`?**  
**A:** For missing required skills: `Math.ceil((req.weight / totalWeight) * 30)`. For missing optional or `PARTIAL` skills: `Math.ceil((req.weight / totalWeight) * 15)`.

**Q78. How does `skillgap.engine.ts` generate learning steps?**  
**A:** `detectCategory()` matches the skill name against `CATEGORY_KEYWORDS` across 13 categories (`programming`, `database`, `cloud`, `devops`, `ml`, `webfrontend`, `webbackend`, `mobile`, `softskills`, `testing`, `security`, `data`, `general`) and populates `{skill}` in the corresponding 5-step `STEP_TEMPLATES`.

**Q79. How are skill-gap recommendations sorted?**  
**A:** Descending by priority (`high: 3`, `medium: 2`, `low: 1`), and then descending by `potentialLift`.

**Q80. What is the limitation of the current substring fallback in `findBestMatch()`?**  
**A:** Short substrings could occasionally match unintended compound names, which is why substring matches are capped at `PARTIAL` (`0.5` contribution) rather than `STRONG` (`1.0`).

**Q81. How could you enhance the matching engine with ML/NLP in v2.0?**  
**A:** By adding an asynchronous PDF text-extraction worker (activating `ResumeState.EXTRACTING` → `EXTRACTED`) and using `pgvector` embeddings as a secondary semantic signal while keeping hard eligibility rules deterministic.

**Q82. How are the engines tested for correctness?**  
**A:** `__tests__/engines/` contains dedicated suites (`eligibility.test.ts`, `matching.test.ts`, `skillgap.test.ts`) and `jest.config.ts` enforces `lines: 80, branches: 80` coverage on `lib/engines/**`.

---

## Category G: Security & Testing (83–95)

**Q83. How do you prevent header spoofing on `x-user-id` and `x-user-role`?**  
**A:** `proxy.ts` runs on every `/api/v1/:path*` request and explicitly calls `requestHeaders.delete('x-user-id')` and `requestHeaders.delete('x-user-role')` *before* checking if the route is public or verifying the JWT.

**Q84. How do you prevent an access token from being used at `/api/v1/auth/refresh`?**  
**A:** Access tokens are signed with `JWT_SECRET`, while refresh tokens are signed with a separate `JWT_REFRESH_SECRET`. `/api/v1/auth/refresh` verifies exclusively with `getJwtRefreshSecret()`.

**Q85. What happens if `JWT_SECRET` or `JWT_REFRESH_SECRET` is missing or too short?**  
**A:** As documented in `.env.example` and enforced by `lib/auth/env.ts`, both secrets require a minimum of 32 characters and the app refuses to boot without them.

**Q86. How is brute-force login prevented?**  
**A:** `app/api/v1/auth/route.ts` uses `checkRateLimit('login:<clientIp>', 10, 60_000)` (10 attempts per minute) and logs failed attempts to `AuditEvent` (`AUTH_LOGIN_FAILED`) without logging passwords.

**Q87. How do you validate uploaded resume PDFs?**  
**A:** `resumes.service.ts:uploadResume()` checks: (1) `mimetype === 'application/pdf'`, (2) `size <= 5MB`, and (3) actual file bytes start with `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`) so renamed HTML/executables are rejected.

**Q88. How do you prevent IDOR (Insecure Direct Object Reference) in evaluations and resumes?**  
**A:** In `evaluations/queue` and `students/me/*`, when `user.role === 'STUDENT'`, the handler ignores client-supplied IDs and resolves `student.id` from `user.userId`. `getEvaluation()` also checks `evaluation.student.userId !== requestingUserId` (`403 FORBIDDEN`).

**Q89. What security headers are configured in `next.config.js`?**  
**A:** `X-DNS-Prefetch-Control: on`, `X-Frame-Options: SAMEORIGIN`, and `X-Content-Type-Options: nosniff`.

**Q90. How is SQL injection prevented?**  
**A:** All database queries go through Prisma ORM, which uses parameterized queries automatically.

**Q91. What types of automated tests exist in the repository?**  
**A:** Jest unit tests (`__tests__/engines/`, `__tests__/auth/`), API integration tests (`__tests__/api/`), security edge-case tests (`__tests__/security/auth-edges.test.ts`, `middleware.test.ts`), and Playwright E2E + `@axe-core/playwright` accessibility tests (`e2e/`).

**Q92. Why is `testTimeout: 60_000` set in `jest.config.ts`?**  
**A:** API integration tests run against a remote Neon PostgreSQL test database (`.env.test`), where multi-query handlers over network round-trips can exceed Jest's default 5-second timeout.

**Q93. What is tested in `e2e/accessibility.spec.ts`?**  
**A:** It uses `@axe-core/playwright` to run automated WCAG accessibility checks against rendered pages in Chromium.

**Q94. What happens if `UPLOAD_DIR` is not mounted as a persistent volume in Docker?**  
**A:** Uploaded PDFs stored in `/data/uploads` would be lost on container restart, which is why `Dockerfile` explicitly documents attaching a volume to `/data/uploads`.

**Q95. Are there any known security limitations in the current codebase?**  
**A:** Tokens are stored in `localStorage` (accessible to JS if XSS occurred, though mitigated by React escaping) rather than `HttpOnly` cookies, and the in-memory rate limiter resets on server restart.

---

## Category H: Project Evaluation Questions (96–105)

**Q96. What was the most technically challenging part of the project?**  
**A:** Designing the versioned evaluation architecture (`Job` → `JobVersion` → `Evaluation` with `snapshotHash` idempotency) and ensuring Edge-safe JWT verification in Next.js 16 `proxy.ts` paired with the Axios `401` refresh queue.

**Q97. What happens if PostgreSQL is temporarily unreachable?**  
**A:** Prisma throws a connection error, which API route catch blocks log server-side and return as a clean `500 INTERNAL_ERROR` JSON response without leaking stack traces or DB credentials.

**Q98. How would you scale PeerSphere to 50,000 students across multiple servers?**  
**A:** (1) Replace the in-memory `rate-limit.ts` `Map` with Redis, (2) move PDF storage from `UPLOAD_DIR` to S3/Tigris presigned URLs, (3) offload evaluation batching to a background job queue, and (4) use Neon read replicas / connection pooling.

**Q99. What would you improve if given 2 more months?**  
**A:** Implement the asynchronous PDF NLP skill-extraction worker (activating `ResumeState.EXTRACTING` → `EXTRACTED`), add self-service student onboarding/password reset, and add email/calendar notifications for scheduled interviews.

**Q100. Why is `applicationCount` computed live in `listJobs()` if `JobVersion` already has an `applicationCount` column?**  
**A:** Seed scripts and status transitions can cause denormalized counters to drift, so `listJobs()` uses `prisma.application.groupBy` to guarantee accurate live counts.

**Q101. How do you ensure an admin override cannot erase the AI's original assessment?**  
**A:** `ReviewOverride` is a separate table linked to `Evaluation`. `overrides.service.ts:createOverride()` only inserts into `review_overrides` and `audit_events` inside a transaction—never updating `Evaluation.overallScore` or `matchSummary`.

**Q102. What happens if a job has 0 required skills?**  
**A:** In `matching.engine.ts`, `weightedScoreDenominator` is `0`, so `overallScore` and `coveragePercent` default to `100` instead of dividing by zero.

**Q103. What happens if a student has no CGPA recorded yet (`cgpa === null`)?**  
**A:** `checkEligibility()` records `'CGPA not yet verified'` as a conditional reason and marks the status `PENDING` (unless another hard rule like backlogs or department already failed, in which case it returns `INELIGIBLE`).

**Q104. How do you verify that `lib/engines/**` code quality doesn't regress?**  
**A:** `jest.config.ts` enforces `coverageThreshold: { 'lib/engines/**': { lines: 80, branches: 80 } }`, failing `npm test` if coverage drops below 80%.

**Q105. What was your individual contribution to this group project?**  
**A:** *(Confirm your specific module(s) from the codebase—e.g., Core Matching/Eligibility/Skill-Gap Engines, Prisma Schema & API Services, Security/Auth Proxy & Testing, or Student/Placement Frontend Portals—and explain the exact files you owned.)*
