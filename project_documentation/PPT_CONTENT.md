# PeerSphere — College Project Presentation Content (24 Slides)

> **Presentation Title:** PeerSphere — AI-Based Placement Matching & Skill Gap Analysis Platform  
> **Target Audience:** 7th Semester B.Tech CSE-AI Project Evaluation Panel & External Examiners

---

## Slide 1: Title Slide
**Slide Content:**
- **Title:** PeerSphere
- **Subtitle:** Explainable Campus Placement Matching & Skill-Gap Analysis Platform
- **Course:** B.Tech CSE-AI — 7th Semester Major Project
- **Tech Stack:** Next.js 16 • React 19 • TypeScript • PostgreSQL 16 • Prisma ORM

**Technical Points:** Unified full-stack institutional web platform; deterministic, zero-hallucination decision intelligence.  
**Suggested Visual:** `01-landing.png` (cropped hero section) or clean title banner with PeerSphere brand mark.  
**Speaker Notes:** Good morning respected panel members. Today we present **PeerSphere**, an institutional campus placement matching and skill-gap analysis platform built for universities, students, and placement cells.

---

## Slide 2: Team Members & Project Guide
**Slide Content:**
- **Team Members:** `[Member 1 Name — Roll No]` | `[Member 2 Name — Roll No]` | `[Member 3 Name — Roll No]` | `[Member 4 Name — Roll No]`
- **Project Guide:** `[Guide Name, Designation, Department of CSE-AI]`
- **Institution:** `[College / University Name]` — Academic Year 2026–27

**Technical Points:** Placeholder template for group details.  
**Suggested Visual:** Clean institutional header card.  
**Speaker Notes:** Introduce each team member and briefly mention the project guide who mentored the architecture and evaluation design.

---

## Slide 3: Project Introduction
**Slide Content:**
- **What is PeerSphere?** A unified campus placement intelligence platform for **Students** and **Placement Officers (`PLACEMENT_ADMIN`)**.
- **Core Philosophy:** *"Explainable. Never black-box."*
- **Key Capabilities:**
  - Automated eligibility screening (CGPA, backlogs, branch, program)
  - Deterministic, weighted skill-match scoring (`STRONG` / `PARTIAL` / `MISSING`)
  - Actionable skill-gap learning roadmaps with projected score lift
  - Human-in-the-loop governance with append-only audit logs

**Technical Points:** Built as a unified Next.js 16 App Router application with same-origin `/api/v1/*` route handlers and PostgreSQL persistence.  
**Suggested Visual:** Split diagram showing Student Portal (`/student`) and Placement Officer Portal (`/placement`).  
**Speaker Notes:** PeerSphere replaces manual spreadsheet screening and opaque black-box resume scores with a single transparent platform where every score is traceable to exact rules and skill evidence.

---

## Slide 4: Problem Statement
**Slide Content:**
- **Manual Screening Bottleneck:** Placement cells manually filter hundreds of student records per drive.
- **Opaque AI Scoring:** Black-box LLM resume screeners hallucinate skills and produce non-reproducible scores.
- **Zero Actionable Feedback:** Students are rejected without knowing *which* skills they lack or *how* to improve.
- **Missing Accountability:** Spreadsheet shortlisting lacks versioned job criteria and tamper-evident audit trails.

**Technical Points:** Addresses reproducibility, explainability, and institutional compliance in campus recruitment.  
**Suggested Visual:** 4-quadrant problem-impact graphic.  
**Speaker Notes:** During campus drives, placement coordinators spend hours cross-checking CGPA and backlogs, while students receive binary accept/reject outcomes with zero guidance on skill gaps.

---

## Slide 5: Motivation
**Slide Content:**
- **Firsthand Student Experience:** Final-year students lack clarity on drive readiness before applying.
- **Need for Explainable AI (XAI) Principles:** In high-stakes academic/career decisions, every point must be defensible.
- **Bridging the Gap:** Turn placement rejection into a structured, week-by-week upskilling roadmap.

**Technical Points:** Combines deterministic rule engines with human-in-the-loop review flags (`requiresReview`).  
**Suggested Visual:** Before/After comparison: "Opaque Rejection" vs. "86/100 Match + 3-Week Docker Roadmap (+12 pts)".  
**Speaker Notes:** As 7th-semester CSE-AI students, we wanted a system that doesn't just rank students, but explains *why* a score occurred and *what* a student can learn next.

---

## Slide 6: Existing System & Limitations
**Slide Content:**
- **Spreadsheets & Google Forms:** High manual effort, prone to formula errors, no skill-level matching.
- **Generic Job Portals:** Lack university-specific rules (CGPA, active backlogs, department/program filters).
- **LLM-Only Resume Parsers:** Non-deterministic outputs, hallucination risk, high API latency and cost.

**Technical Points:** Comparison across determinism, auditability, cost, and institutional rule support.  
**Suggested Visual:** Comparison matrix table.  
**Speaker Notes:** Existing tools either lack intelligence (spreadsheets) or lack explainability and determinism (black-box LLMs).

---

## Slide 7: Proposed System
**Slide Content:**
- **Unified Full-Stack Architecture:** Next.js 16 + PostgreSQL 16 + Prisma ORM.
- **Three Pure-Function Engines (`lib/engines/`):**
  1. `eligibility.engine.ts` — Hard & soft academic rule checks
  2. `matching.engine.ts` — Weighted taxonomy & alias skill matching
  3. `skillgap.engine.ts` — Prioritized learning roadmaps
- **Immutable Snapshots & Auditability:** SHA-256 `snapshotHash` + append-only `ReviewOverride` & `AuditEvent`.

**Technical Points:** Side-effect-free engines tested to `>= 80%` line and branch coverage.  
**Suggested Visual:** 3-engine pipeline diagram (`Eligibility → Matching → Skill-Gap`).  
**Speaker Notes:** Our proposed system separates pure decision logic from database I/O, ensuring every evaluation is fast, testable, and 100% reproducible.

---

## Slide 8: Objectives
**Slide Content:**
1. Automate multi-criteria eligibility screening (`ELIGIBLE`, `INELIGIBLE`, `CONDITIONAL`, `PENDING`).
2. Compute transparent, weighted skill-match scores (`0–100`) and confidence metrics.
3. Generate prioritized skill-gap roadmaps with learning steps, weeks, and `potentialLift`.
4. Empower placement officers with ranking matrices, candidate comparison, and audited overrides.
5. Enforce production-grade security (Edge JWT, bcrypt, RBAC, rate limiting, PDF magic-byte validation).

**Technical Points:** Measurable engineering and functional goals verified via Jest and Playwright suites.  
**Suggested Visual:** Numbered objective cards with icons.  
**Speaker Notes:** Walk through the five concrete objectives that guided our architecture and testing.

---

## Slide 9: Key Features
**Slide Content:**
- **For Students:** Bento Readiness Dashboard, Job Discovery, Instant Match Breakdown, Skill-Gap Roadmaps, PDF Resume Versioning, Application Tracker.
- **For Placement Officers:** Versioned Job Wizard (`JobVersion`), Ranked Candidate Matrix, Side-by-Side Comparison (`/placement/compare`), Audited Overrides, Cohort Skill-Gap Analytics, Live CSV Reports.
- **Cross-Cutting:** PWA support (`sw.js`), Light/Dark/System themes, WCAG accessibility checks.

**Technical Points:** 14+ frontend pages across `(student)` and `(placement)` route groups.  
**Suggested Visual:** Two-column feature showcase with `06-student-dashboard-ok.png` & `02-admin-dashboard.png`.  
**Speaker Notes:** Highlight how both personas share the same underlying match breakdown so there is zero ambiguity between student and officer views.

---

## Slide 10: Technology Stack
**Slide Content:**
- **Frontend:** Next.js 16.3.1 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Framer Motion, Recharts, Lucide Icons
- **Backend:** Next.js API Route Handlers (`/api/v1/*`), Zod Validation, `bcryptjs`
- **Auth & Security:** HS256 JWT via Web Crypto API (`proxy.ts`), Sliding-Window Rate Limiter
- **Database:** PostgreSQL 16 (Neon Cloud / Docker), Prisma ORM 5.22.0
- **Testing & DevOps:** Jest, Playwright, `@axe-core/playwright`, Docker (multi-stage standalone build)

**Technical Points:** Unified TypeScript stack eliminates frontend/backend DTO drift.  
**Suggested Visual:** Layered tech-stack architecture diagram.  
**Speaker Notes:** Explain why a unified Next.js + Prisma + PostgreSQL stack was chosen—end-to-end type safety, single deployment unit, and Edge-safe JWT verification.

---

## Slide 11: System Architecture
**Slide Content:**
- **Client Layer:** React 19 UI → Typed Services (`student-api.ts`, `placement-api.ts`) → Axios Interceptor (`api-client.ts`)
- **Edge Security Layer (`proxy.ts`):** Strips client `x-user-*` headers, verifies JWT, injects verified identity
- **API & Service Layer:** Zod-validated Route Handlers → Domain Services (`lib/services/*`) → Pure Engines (`lib/engines/*`)
- **Persistence Layer:** PostgreSQL 16 (14 tables) + Local/Volume PDF Storage (`UPLOAD_DIR`)

**Technical Points:** Strict separation of concerns: Proxy → Route → Service → Engine → Prisma.  
**Suggested Visual:** Mermaid System Architecture flowchart from `PROJECT_WORKFLOW.md`.  
**Speaker Notes:** Trace how a request flows securely from the browser through `proxy.ts` down to the service and database layers.

---

## Slide 12: Database Design (ER Model)
**Slide Content:**
- **14 Prisma Models & 11 Enums** in PostgreSQL 16:
  - **Identity:** `User`, `Student`
  - **Skills & Resumes:** `Skill` (with `aliases[]`), `StudentSkillEvidence`, `ResumeVersion`
  - **Drives:** `Job`, `JobVersion`, `JobRequirement`
  - **Evaluations:** `Evaluation` (`inputSnapshot`, `snapshotHash`), `RequirementMatch`, `Recommendation`
  - **Workflow & Governance:** `Application`, `ReviewOverride` (append-only), `AuditEvent` (append-only)

**Technical Points:** Composite indexes on `[studentId, createdAt]`, `[jobVersionId, overallScore]`, `[snapshotHash]`, `[jobId, status]`.  
**Suggested Visual:** Mermaid ER diagram from `TECHNICAL_REFERENCE.md`.  
**Speaker Notes:** Emphasize two key design decisions: `JobVersion` (so editing a job never invalidates past evaluations) and `Evaluation.snapshotHash` (for idempotency).

---

## Slide 13: Complete Application Workflow
**Slide Content:**
1. **Sign-In:** Role selection → `POST /api/v1/auth` → HS256 Access (15m) + Refresh (7d) tokens
2. **Profile & Resume:** Student adds skills & uploads `%PDF-` verified resume
3. **Drive Publishing:** Officer creates `Job` (`DRAFT`) → `JobVersion` → `POST /publish`
4. **Evaluation:** `POST /evaluations/queue` → Eligibility + Match + Skill-Gap Engines
5. **Application & Shortlisting:** `POST /jobs/[id]/apply` → Admin reviews, overrides, or updates status

**Technical Points:** End-to-end closed loop from job creation to placement analytics.  
**Suggested Visual:** Horizontal 5-stage workflow diagram.  
**Speaker Notes:** Walk through the lifecycle of a single placement drive from creation by the officer to application and upskilling by the student.

---

## Slide 14: Feature 1 — Deterministic Eligibility & Matching Engine
**Slide Content:**
- **Eligibility (`checkEligibility`):** Checks CGPA, active backlogs, department, and program.
- **3-Tier Skill Resolution (`findBestMatch`):**
  1. Exact canonical match (`1.0` if confidence ≥ 75)
  2. Taxonomy alias match (e.g., `Postgres` → `PostgreSQL`)
  3. Substring fallback (`PARTIAL`, `0.5` contribution)
- **Weighted Score:** $\text{overallScore} = \text{round}\left(\frac{\sum \text{contribution} \times \text{weight}}{\sum \text{weight}} \times 100\right)$

**Technical Points:** Flags `requiresReview = true` if `confidenceScore < 60`, aliases conflict, or eligibility is `CONDITIONAL`.  
**Suggested Visual:** Code-to-UI mapping showing `computeMatch()` output rendered in `MatchScore` + `SkillChip`.  
**Speaker Notes:** Explain how `computeMatch()` avoids black-box randomness and gives exact per-skill explanations.

---

## Slide 15: Feature 2 — Actionable Skill-Gap Roadmap Engine
**Slide Content:**
- **Input:** `MISSING` and `PARTIAL` items from `RequirementMatch`.
- **Priority & Effort:**
  - High (`weight >= 1.5`, required): 5 weeks, up to +30 pts scale
  - Medium (required or partial): 3 weeks
  - Low (optional/preferred): 2 weeks, up to +15 pts scale
- **13 Skill Categories:** `detectCategory()` maps skills to curated 5-step action plans.

**Technical Points:** Deduplicates repeated skills across multiple job drives on the student dashboard.  
**Suggested Visual:** `SkillGapCard` / `RecommendationCard` UI screenshot or card mockup.  
**Speaker Notes:** Show how PeerSphere converts a `MISSING` skill into concrete weekly steps and a quantified `potentialLift`.

---

## Slide 16: Feature 3 — Candidate Ranking, Comparison & Audited Overrides
**Slide Content:**
- **Ranked Matrix (`/placement/candidates`):** Sorts applicants by `overallScore` with eligibility & coverage badges.
- **Side-by-Side Comparison (`/placement/compare`):** Compares multiple candidates' skills and rules.
- **Append-Only Overrides (`POST /evaluations/[id]/override`):**
  - Decisions: `shortlist`, `reject`, `review`, `promote`
  - Mandatory written `reason` stored in `ReviewOverride` + `AuditEvent`

**Technical Points:** Original AI `Evaluation` is never mutated; human decisions are layered transparently on top.  
**Suggested Visual:** `03-candidates.png` and `04-candidate-override.png`.  
**Speaker Notes:** Demonstrate how placement officers maintain full authority while preserving compliance and auditability.

---

## Slide 17: Core Algorithm & Explainability Architecture
**Slide Content:**
- **Why Deterministic Engines over LLMs?**
  - **Zero Hallucination:** Only matches against verified `StudentSkillEvidence` and `Skill` taxonomy.
  - **Idempotency:** SHA-256 `snapshotHash` guarantees identical inputs always return identical scores.
  - **Auditability:** Every `RequirementMatch` stores `contribution` (`0 / 0.5 / 1.0`) and `explanation`.
  - **Zero Inference Cost:** Sub-millisecond pure TypeScript execution.

**Technical Points:** `algorithmVersion: "2.1.0"` tracked on every `Evaluation` record for future algorithm upgrades.  
**Suggested Visual:** Evaluation idempotency flowchart (`snapshotHash` check → cache hit vs. engine run).  
**Speaker Notes:** Directly address the CSE-AI aspect: explainable, deterministic symbolic/rule-based AI vs. stochastic generative AI for high-stakes scoring.

---

## Slide 18: API Integration & Backend Processing
**Slide Content:**
- **30+ REST Endpoints** under `/api/v1/*` with unified `{ success, data, requestId }` envelope.
- **Frontend Client (`lib/api-client.ts`):**
  - Attaches `Bearer` JWT on every request.
  - Intercepts `401`, queues concurrent requests, refreshes via `/api/v1/auth/refresh`, and retries seamlessly.
- **Live Reports (`/api/v1/reports/[id]`):** 6 real-time database reports with client-side UTF-8 BOM CSV export.

**Technical Points:** `ApiError` + `isApiError()` structural guard ensures clean error propagation across bundled routes.  
**Suggested Visual:** Request/Response interceptor & `ApiResponse` JSON structure diagram.  
**Speaker Notes:** Highlight the 401 refresh-queue mechanism that prevents race conditions when multiple dashboard API calls expire simultaneously.

---

## Slide 19: Security & Validation
**Slide Content:**
- **Authentication:** `bcryptjs` (cost 10), separate `JWT_SECRET` (15m) & `JWT_REFRESH_SECRET` (7d), Web Crypto HS256.
- **Header Sanitization (`proxy.ts`):** Strips client-supplied `x-user-id` / `x-user-role` on *every* request.
- **Rate Limiting (`rate-limit.ts`):** Sliding-window `10 req/min` on login, `30 req/min` on token refresh.
- **Input & File Security:** Zod schemas on all payloads; `%PDF-` magic-byte check + 5MB limit + SHA-256 checksum on resume uploads.
- **Security Headers (`next.config.js`):** `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`.

**Technical Points:** Prevents IDOR (students scoped via `userId`), MIME spoofing, and header injection.  
**Suggested Visual:** Security defense-in-depth layers diagram.  
**Speaker Notes:** Walk through each defense layer—especially `proxy.ts` header stripping and `%PDF-` magic-byte validation.

---

## Slide 20: Testing & Verification
**Slide Content:**
- **Type Safety & Linting:** `tsc --noEmit` (0 errors verified), `eslint` (`eslint-config-next`).
- **Jest Unit & Integration Suite (`__tests__/`):**
  - Engine tests (`eligibility`, `matching`, `skillgap`) with **≥80% line & branch coverage threshold**
  - Auth & security tests (`jwt`, `rate-limit`, `auth-edges`, `middleware`)
  - API route integration tests (`auth`, `jobs`, `applications`, `evaluations`, `overrides`, `analytics`, `students`)
- **Playwright E2E & Accessibility (`e2e/`):** Student flow, Admin flow, Visual snapshots, `@axe-core/playwright`.

**Technical Points:** `jest.config.ts` enforces coverage regressions on `lib/engines/**`.  
**Suggested Visual:** Test pyramid diagram showing Unit (Engines) → Integration (API/Security) → E2E/A11y (Playwright).  
**Speaker Notes:** Emphasize that testing is built into the project structure, including automated accessibility audits with Axe.

---

## Slide 21: Application Screenshots & Demo Flow
**Slide Content:**
- **Live Demo Sequence:**
  1. Landing Page (`01-landing.png`) — Explainability Showcase
  2. Student Dashboard (`06-student-dashboard-ok.png`) & Jobs (`07-student-jobs.png`)
  3. Admin Dashboard (`02-admin-dashboard.png`)
  4. Candidate Ranking (`03-candidates.png`) & Audited Override (`04-candidate-override.png`)

**Technical Points:** End-to-end walkthrough using seeded institutional data (`prisma/seed.ts`).  
**Suggested Visual:** 2×2 grid of actual application screenshots (`01-landing.png`, `06-student-dashboard-ok.png`, `02-admin-dashboard.png`, `03-candidates.png`).  
**Speaker Notes:** Briefly narrate the 4-screen demo flow before switching to the live application (or screenshots).

---

## Slide 22: Challenges Faced & Solutions
**Slide Content:**
- **Challenge 1: Edge Runtime JWT Verification** → *Solution:* Implemented HS256 using standard Web Crypto API (`crypto.subtle`) in `lib/auth/jwt.ts` instead of Node-only `jsonwebtoken`.
- **Challenge 2: Concurrent 401 Token Refresh Loops** → *Solution:* Built an Axios `failedQueue` mutex in `lib/api-client.ts` so parallel requests wait for a single refresh call.
- **Challenge 3: Denormalized Count Drift & Versioned Jobs** → *Solution:* Separated `Job` from `JobVersion` and computed live `applicationCount` / `shortlistedCount` via Prisma `groupBy`.

**Technical Points:** Real architectural challenges solved in the codebase.  
**Suggested Visual:** 3-row Challenge → Solution cards.  
**Speaker Notes:** Discussing real bugs and architectural fixes (like Edge Web Crypto and Axios refresh queueing) demonstrates deep engineering ownership.

---

## Slide 23: Limitations & Future Scope
**Slide Content:**
- **Current Limitations:**
  - Resume PDFs are stored & verified (`%PDF-`) but skill extraction is manual (`ResumeState` NLP pipeline not yet wired).
  - Rate limiter uses in-memory `Map` (single-instance) and resumes use local/Docker disk (`UPLOAD_DIR`).
- **Future Scope:**
  - Asynchronous NLP/OCR resume skill-extraction worker (`EXTRACTING` → `EXTRACTED`).
  - Redis-backed distributed rate limiting & S3/Tigris object storage.
  - `pgvector` semantic similarity as a secondary signal + automated email/interview notifications.

**Technical Points:** Honest separation of implemented features vs. planned roadmap.  
**Suggested Visual:** Current v1.0 vs. Planned v2.0 roadmap.  
**Speaker Notes:** Being transparent about current limitations and how the schema (`ResumeState`) is already prepared for future NLP extraction impresses examiners.

---

## Slide 24: Conclusion & References
**Slide Content:**
- **Conclusion:** PeerSphere delivers fast, deterministic, and 100% explainable campus placement matching—empowering students with actionable skill-gap roadmaps and placement officers with audited governance.
- **Key References:**
  - Next.js 16 Documentation (`nextjs.org/docs`)
  - Prisma ORM & PostgreSQL 16 Documentation (`prisma.io/docs`)
  - Web Crypto API MDN Specification & OWASP Top 10 Security Guidelines
  - Playwright & Axe-Core Accessibility Testing (`playwright.dev`)
- **Thank You! — Questions & Viva**

**Technical Points:** Summarizes impact and cites core engineering references.  
**Suggested Visual:** Clean closing slide with PeerSphere logo and Q&A prompt.  
**Speaker Notes:** Thank the panel and invite questions.
