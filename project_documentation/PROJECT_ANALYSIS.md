# PeerSphere — Complete Project Analysis

**Project Title:** PeerSphere — AI-Based Placement Matching & Skill Gap Analysis Platform  
**Version:** `1.0.0`  
**Academic Context:** 7th Semester B.Tech CSE-AI Group Project  
**Repository Type:** Unified Full-Stack Web Application (Next.js 16 App Router + Prisma + PostgreSQL)

---

## 1. Project Title and Introduction

**PeerSphere** is an institutional campus placement intelligence platform designed for students and university placement cells (`PLACEMENT_ADMIN`). Unlike black-box resume screeners or generic job boards, PeerSphere provides:

- **Deterministic Eligibility Screening** (`lib/engines/eligibility.engine.ts`) based on CGPA, active backlogs, department, and academic program.
- **Explainable, Zero-Hallucination Skill Matching** (`lib/engines/matching.engine.ts`) that scores candidates against weighted job requirements using canonical skill names, taxonomy aliases, substring fallbacks, and evidence confidence scores.
- **Actionable Skill-Gap Learning Roadmaps** (`lib/engines/skillgap.engine.ts`) that translate missing or partial skills into prioritized improvement steps, estimated learning weeks, and projected score lift (`potentialLift`).
- **Human-in-the-Loop Governance** via append-only `ReviewOverride` records and `AuditEvent` logs, ensuring placement officers remain accountable for every final shortlisting decision.

---

## 2. Problem Statement

University campus placement cells and final-year engineering students face several recurring problems during recruitment drives:

1. **Manual & Error-Prone Screening:** Placement officers manually filter hundreds of student spreadsheets against varying company rules (CGPA cutoffs, backlog limits, allowed branches/programs), which is slow and prone to human error.
2. **Opaque Black-Box Scoring:** Modern AI/LLM resume screeners often produce unexplainable scores or hallucinate qualifications, making it impossible for placement officers to defend shortlisting decisions to recruiters or students.
3. **Lack of Actionable Feedback for Students:** Rejected or unshortlisted students rarely learn *why* they were not selected or *which specific skills* to learn to improve their placement readiness.
4. **No Audit Trail:** Manual overrides and application status changes in spreadsheets or emails lack a tamper-evident, timestamped audit history.

---

## 3. Existing System and Its Limitations

| Existing Approach | How It Works | Key Limitations |
|---|---|---|
| **Spreadsheets & Google Forms** | Students submit details via forms; coordinators filter rows manually in Excel/Sheets. | High manual effort, no skill-level matching, easy to introduce formula/filtering errors, zero auditability. |
| **Generic Job Portals** | Keyword search and basic profile listing. | No institutional eligibility rules (CGPA, backlogs, branch), no weighted skill-gap roadmaps. |
| **Black-Box LLM Resume Screeners** | Prompts an LLM to output a 0–100 score or summary. | Non-deterministic (different scores on re-run), prone to hallucinations, cannot trace individual points back to rules/skills, high API cost. |

---

## 4. Proposed System

PeerSphere unifies student career readiness and placement cell operations in a single **Next.js 16** application backed by **PostgreSQL 16** and **Prisma ORM**:

- **Dual-Role Workspaces:**
  - **Student Portal (`/student/*`):** Bento readiness dashboard, job discovery, one-click eligibility & match evaluation, interactive skill-gap roadmaps, profile/skill management, PDF resume versioning, and application status tracking.
  - **Placement Officer Portal (`/placement/*`):** Executive KPI dashboard, multi-step drive creation/publishing, ranked candidate matrices, side-by-side candidate comparison (`/placement/compare`), human review overrides with mandatory written reasons, cohort analytics, and live CSV-exportable reports.
- **Deterministic Pure-Function Engines:** All scoring, eligibility, and gap calculations run in isolated, side-effect-free TypeScript modules (`lib/engines/`) with strict unit-test coverage thresholds (`>= 80%` lines and branches).
- **Idempotent Evaluation Snapshots:** Every evaluation hashes its exact inputs (`snapshotHash` via SHA-256) and stores an immutable `inputSnapshot` JSON in PostgreSQL, guaranteeing 100% reproducible results.

---

## 5. Motivation Behind the Project

As 7th-semester B.Tech CSE-AI students preparing for campus placements, we observed two major gaps firsthand:
1. Students do not know how closely their current skill profile aligns with upcoming company drives or which missing skill gives the highest return on study time.
2. Placement coordinators spend excessive time verifying eligibility and shortlisting candidates without transparent, auditable tooling.

We built PeerSphere to bridge this gap with **explainable, deterministic decision intelligence**—where every number on the screen is one click away from its exact rule and skill-evidence breakdown.

---

## 6. Objectives and Expected Outcomes

### Objectives
1. Automate campus drive eligibility verification (CGPA, active backlogs, department, program).
2. Implement a deterministic, explainable skill-matching algorithm (`STRONG` / `PARTIAL` / `MISSING`) with confidence scoring and review flags.
3. Generate prioritized, step-by-step skill-gap roadmaps with estimated learning duration and score lift.
4. Provide placement officers with candidate ranking, side-by-side comparison, audited overrides, and live analytics/reports.
5. Enforce strong security: Edge-safe JWT authentication, bcrypt password hashing, role-based access control (RBAC), rate limiting, and PDF magic-byte validation.

### Expected Outcomes
- Faster, error-free candidate screening for placement cells.
- Transparent, defensible shortlisting decisions with an append-only audit trail.
- Measurable student upskilling guided by prioritized skill-gap roadmaps.

---

## 7. Target Users and Use Cases

### Target Users
1. **Students (`UserRole.STUDENT`):** Final-year / pre-final-year university students preparing for internships and full-time campus drives.
2. **Placement Officers / Admins (`UserRole.PLACEMENT_ADMIN`):** Training & Placement (T&P) cell coordinators and faculty advisors.

### Core Use Cases
- **Student:** View placement readiness, manage verified/manual skills, upload PDF resumes, browse published drives, run match evaluations, inspect skill-gap roadmaps, apply to eligible jobs, and track application stages.
- **Placement Officer:** Create/edit/publish/close drives with versioned requirements (`JobVersion`), rank applicants by match score, compare candidates side-by-side, override AI flags (`shortlist`, `reject`, `review`, `promote`) with mandatory justification, inspect audit logs, and export live reports as CSV.

---

## 8. Scope of the Project

### Implemented Scope (Verified in Source Code)
- **Authentication & RBAC:** Email/password login (`POST /api/v1/auth`), token refresh (`POST /api/v1/auth/refresh`), HS256 JWT via Web Crypto (`lib/auth/jwt.ts`), Next.js 16 `proxy.ts` header sanitization, and `ProtectedRouteWithRole` on the frontend.
- **Student Module:** Profile management, manual skill taxonomy additions/removals, PDF resume upload/download/soft-delete with `%PDF-` magic-byte and SHA-256 verification, job browsing, evaluation queueing, skill-gap roadmap viewing, and job applications.
- **Placement Admin Module:** Versioned job creation/update/publish/close, candidate ranking and comparison, append-only review overrides, application status state-machine transitions, cohort placement stats, top-10 skill-gap analytics, 6 live database-backed reports with CSV export, and audit log viewer.
- **PWA & Theming:** Light/Dark/System theme switcher (`ThemeProvider`) and service worker registration (`public/sw.js`, `app/manifest.ts`).
- **Automated Testing:** Jest unit/integration/security tests (`__tests__/`) and Playwright E2E + `@axe-core/playwright` accessibility tests (`e2e/`).

### Out of Scope / Not Implemented in Current Version
- Automated NLP/LLM PDF resume text parsing (see Section 11).
- Self-service student registration UI (users are seeded via `prisma/seed.ts`).
- Email/SMS notifications for interview schedules or status updates.

---

## 9. Unique Features and Innovations

1. **Zero-Hallucination Deterministic Matching:** Unlike LLM-based screeners, PeerSphere's `computeMatch()` engine produces 100% reproducible scores with explicit `STRONG` (`1.0`), `PARTIAL` (`0.5`), and `MISSING` (`0.0`) contributions.
2. **Immutable Evaluation Snapshots (`inputSnapshot` + `snapshotHash`):** Re-running an evaluation with unchanged student skills and job requirements returns the cached evaluation via SHA-256 hash lookup, ensuring consistency and idempotency.
3. **Versioned Job Requirements (`Job` → `JobVersion`):** Editing a draft job creates a new `JobVersion` without corrupting historical evaluations tied to earlier versions.
4. **Confidence-Gated Human Review (`requiresReview`):** Evaluations with `confidenceScore < 60`, conflicting skill aliases, or `CONDITIONAL` eligibility are automatically flagged for placement officer review.
5. **Append-Only Governance (`ReviewOverride` & `AuditEvent`):** Overrides never mutate original AI evaluation records; instead, they append a timestamped, reason-backed decision.

---

## 10. Advantages and Practical Applications

- **Advantages:** High transparency, zero external AI API latency/cost, strict type safety (TypeScript + Zod + Prisma), Edge-compatible JWT verification, and built-in accessibility testing.
- **Practical Applications:** University Training & Placement cells, college career readiness centers, coding bootcamp placement cohorts, and internal campus internship portals.

---

## 11. Limitations and Future Scope

### Current Limitations (Verified from Codebase)
1. **Manual Skill Entry vs. Automated Resume Parsing:** While `prisma/schema.prisma` defines `ResumeState` values (`UPLOADED`, `QUARANTINED`, `SCANNED`, `EXTRACTING`, `EXTRACTED`, `NEEDS_MANUAL_REVIEW`, `FAILED`, `DELETED`), `lib/services/resumes.service.ts` currently saves uploaded PDFs with `state: 'UPLOADED'` and does not yet invoke a PDF text-extraction/NLP pipeline.
2. **In-Memory Rate Limiting:** `lib/auth/rate-limit.ts` uses an in-memory `Map`, which is suitable for single-instance deployments but requires Redis for multi-instance horizontal scaling.
3. **Local Filesystem Storage for Resumes:** Resumes are stored on disk (`UPLOAD_DIR`, defaulting to `./uploads` or `/data/uploads` in Docker) rather than object storage (S3/Tigris).
4. **No Self-Registration / Password Reset:** Accounts are provisioned via `prisma/seed.ts`.
5. **Rule-Based Roadmap Templates:** `lib/engines/skillgap.engine.ts` uses 13 curated category templates rather than dynamic course APIs.

### Future Scope
- Integrate an asynchronous worker queue for PDF text extraction and NLP skill-entity recognition (activating the `EXTRACTING` → `EXTRACTED` states).
- Add Redis-backed distributed rate limiting and S3/Tigris presigned URL storage for resumes.
- Implement semantic vector embeddings (e.g., `pgvector`) as a secondary signal alongside deterministic taxonomy matching.
- Add recruiter external portals, automated interview scheduling, and email/push notifications.
