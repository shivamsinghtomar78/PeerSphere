# PeerSphere — Presentation & Demo Scripts

---

## 1. 1-Minute Project Introduction (Elevator Pitch)

> "Good morning, everyone. Our 7th-semester B.Tech CSE-AI project is **PeerSphere** — an explainable campus placement matching and skill-gap analysis platform.  
> Today, university placement cells rely on manual spreadsheets to filter students, while black-box AI resume screeners produce unexplainable scores and zero guidance for rejected students.  
> PeerSphere solves this with a unified **Next.js 16 and PostgreSQL** platform powered by three deterministic, zero-hallucination engines: **Eligibility Screening**, **Weighted Skill Matching**, and **Skill-Gap Roadmaps**.  
> Every match score decomposes into exact skill evidence (`STRONG`, `PARTIAL`, `MISSING`) and pass/fail academic rules. Students get a prioritized week-by-week learning roadmap with projected score lift, and placement officers get ranked candidate matrices, side-by-side comparisons, and an append-only audit trail for every manual override. In short: **Explainable. Never black-box.**"

---

## 2. 3-Minute Project Explanation

> "Respected panel members, our project **PeerSphere** addresses a core challenge in campus recruitment: balancing automation with transparency and accountability.  
>
> **The Problem:** Placement coordinators spend hours manually checking CGPA, active backlogs, and branch eligibility across hundreds of students. Meanwhile, students rarely know *why* they were shortlisted or rejected, or which missing skill would improve their chances most.  
>
> **Our Architecture:** PeerSphere is built as a unified **Next.js 16** full-stack application with **React 19**, **TypeScript**, **Prisma ORM**, and **PostgreSQL 16 (Neon)**. Security is enforced at the Edge via `proxy.ts`, which strips spoofed headers, verifies HS256 JWTs using the Web Crypto API, and injects verified user roles (`STUDENT` or `PLACEMENT_ADMIN`).  
>
> **How It Works:** At the heart of PeerSphere are three pure-function engines in `lib/engines/`:
> 1. **`eligibility.engine.ts`** checks CGPA, active backlogs, department, and program, outputting `ELIGIBLE`, `INELIGIBLE`, `CONDITIONAL`, or `PENDING`.
> 2. **`matching.engine.ts`** resolves student skills against weighted job requirements using exact matches, taxonomy aliases, and substring fallbacks, computing an `overallScore`, `confidenceScore`, and `coveragePercent`.
> 3. **`skillgap.engine.ts`** turns `MISSING` and `PARTIAL` skills into prioritized 5-step roadmaps with estimated weeks and `potentialLift`.
>
> Every evaluation stores an immutable `inputSnapshot` and SHA-256 `snapshotHash` for 100% reproducibility. On the officer side, placement admins can rank candidates, compare them side-by-side, record append-only `ReviewOverride` decisions with mandatory written reasons, and export 6 live database reports as CSV. Thank you."

---

## 3. 5-Minute Complete Presentation Script

> **Introduction (0:00 – 0:45):**  
> "Good morning, respected examiners and faculty members. I am `[Your Name]`, and along with my team `[Team Member Names]`, we present **PeerSphere**, our 7th-semester B.Tech CSE-AI project: an explainable campus placement matching and skill-gap analysis platform."  
>
> **Problem & Motivation (0:45 – 1:30):**  
> "In most colleges, placement screening is either completely manual using spreadsheets or uses opaque black-box LLM tools that hallucinate skills and give inconsistent scores. In high-stakes academic decisions, every score must be defensible. That motivated us to build PeerSphere around one core principle: *Explainable. Never black-box.*"  
>
> **Tech Stack & System Architecture (1:30 – 2:30):**  
> "We built PeerSphere as a unified **Next.js 16** application using **React 19**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL 16**. Our database has 14 models, including versioned `JobVersion` records so editing a job never corrupts past evaluations, and append-only `ReviewOverride` and `AuditEvent` tables for compliance.  
> All `/api/v1/*` requests pass through `proxy.ts`, which verifies HS256 JWTs using the Web Crypto API and enforces role-based access control. We also enforce rate limiting on login/refresh, Zod schema validation, and `%PDF-` magic-byte verification on resume uploads."  
>
> **Core Engines & Explainability (2:30 – 3:45):**  
> "When a student or officer queues an evaluation, `evaluations.service.ts` hashes the inputs with SHA-256 (`snapshotHash`) for idempotency and runs three pure-function engines:  
> - **Eligibility Engine:** Checks CGPA, active backlogs, department, and program.  
> - **Matching Engine:** Resolves skills via exact match, taxonomy aliases, and substring fallback, weighting required skills to produce `overallScore` and `confidenceScore`. If confidence is below 60% or aliases conflict, it flags `requiresReview`.  
> - **Skill-Gap Engine:** Generates prioritized learning steps, estimated weeks, and `potentialLift` across 13 skill categories."  
>
> **Testing, Limitations & Conclusion (3:45 – 5:00):**  
> "We verified the system with `tsc --noEmit` (0 errors), Jest unit/integration/security suites enforcing ≥80% coverage on `lib/engines/**`, and Playwright E2E + Axe accessibility tests. Currently, skill evidence is added manually while PDFs are stored and verified; in future work, we plan to wire an async NLP skill-extraction worker into our `ResumeState` pipeline. Thank you—we are now ready to demonstrate the live application and answer your questions."

---

## 4. Live Application Demo Script

1. **Landing Page (`/` — `01-landing.png`):**
   - Point out the interactive **Explainability Showcase** showing a sample `86` match score decomposed into `Strong`/`Partial` skills and pass/fail CGPA/backlog rules.
2. **Role-Based Sign-In (`/auth`):**
   - Click **Enter as student**, select the **Student** card, and sign in using the seeded demo credentials (`arjun.sharma@college.edu` / `student123`).
3. **Student Portal (`/student` — `06-student-dashboard-ok.png` & `07-student-jobs.png`):**
   - Show the Bento readiness dashboard, profile completeness, and primary match score.
   - Navigate to **Jobs** (`/student/jobs`), open a drive, and trigger/view **Match Analysis** (`/student/match`) and **Skill Gaps** (`/student/skill-gaps`) to show the prioritized roadmap and `potentialLift`.
   - Briefly show **Profile** (`/student/profile`) where skills and `%PDF-` resumes are managed, then **Sign out**.
4. **Placement Officer Portal (`/placement` — `02-admin-dashboard.png`, `03-candidates.png`, `04-candidate-override.png`):**
   - Sign in as **Placement Officer** (`placement@college.edu` / `admin123`).
   - Show executive KPIs and cohort skill-gap chart on `/placement`.
   - Open **Candidates** (`/placement/candidates`), click a candidate to inspect the full breakdown, and demonstrate **Review Override** with a mandatory written reason.
   - Show **Reports** (`/placement/reports`) and generate a live report with CSV export.

---

## 5. Individual Contribution Guide (Confirm Your Role)

> [!IMPORTANT]
> **Action Required:** Please confirm which of the following modules you personally developed so you can speak to them with 100% ownership during your viva. Do not claim modules you did not build.

| Module Area | Key Files in Repository | Talking Points if You Owned This |
|---|---|---|
| **1. Core AI/Matching Engines** | `lib/engines/eligibility.engine.ts`, `matching.engine.ts`, `skillgap.engine.ts`, `__tests__/engines/*` | Pure-function design, 3-tier skill resolution, weighted scoring, confidence gating, ≥80% Jest coverage |
| **2. Database & Backend Services** | `prisma/schema.prisma`, `prisma/seed.ts`, `lib/services/*.service.ts`, `app/api/v1/*` | 14-model ER design, `JobVersion` immutability, `snapshotHash` idempotency, state-machine transitions |
| **3. Auth, Security & DevOps** | `proxy.ts`, `lib/auth/*`, `lib/errors/api-error.ts`, `Dockerfile`, `__tests__/security/*` | Edge-safe Web Crypto JWT, header sanitization, rate limiting, `%PDF-` magic-byte check |
| **4. Student & Placement Frontend** | `app/(student)/*`, `app/(placement)/*`, `components/*`, `services/*`, `lib/api-client.ts`, `e2e/*` | Dual-role Bento dashboards, Axios 401 refresh queue, Recharts analytics, Playwright + Axe tests |

---

## 6. Group Contribution Explanation Template

Use this structure when presenting as a 4-member team:
- **Member 1 (Core Engines & Algorithms):** Designed and tested `eligibility.engine.ts`, `matching.engine.ts`, and `skillgap.engine.ts`.
- **Member 2 (Database & API Services):** Modeled the 14-table Prisma PostgreSQL schema, `seed.ts`, and `/api/v1/*` domain services.
- **Member 3 (Security, Auth & DevOps):** Implemented `proxy.ts`, Web Crypto JWTs, rate limiting, PDF validation, and Docker/Jest security tests.
- **Member 4 (Frontend UI/UX & E2E):** Built the Student and Placement Officer portals, Axios token-refresh client, Recharts analytics, and Playwright E2E/accessibility suite.
