# PeerSphere — Master Development Plan

> **STATUS: EXECUTED — all phases complete (2026-09-08).**
> Final state: 134 unit/integration tests + 20 Playwright e2e specs green (3
> consecutive full runs), zero critical/serious axe violations, Lighthouse
> 95/98/100 (CLS 0) on the production build, exploit/rate-limit replays verified
> against `next start`, deployment runbook at
> `docs/14-devops-and-deployment/runbook.md`.
> Notable adaptations during execution: the DB moved to Neon mid-build (migration
> baseline created via `migrate diff` because the pooled connection can't host a
> shadow DB); Task 8.3's override UI was built from scratch (the API existed but
> no admin page called it); Lighthouse gates for 6.4/9.5 were both closed against
> the production build in Phase 10. Bugs found and fixed by the test gates along
> the way: header-spoofing privilege escalation, doubled `/api/v1` client prefix
> (broke all browser logins), application ownership comparing Student.id to
> User.id, transition-map bypass, anonymous DRAFT listing leak, EligibilityBadge
> enum-case crash, job-detail converter shape crash (×2 portals), Decimal-as-string
> `toFixed` crash, pageSize-over-cap 400s, and admins losing identity on public routes.

Single source of truth for taking PeerSphere from its current state (freshly migrated unified Next.js 16 app, uncommitted, with a live auth-bypass bug and zero tests) to a secure, fully tested, visually distinctive production app.

**Execution rules (read first):**

1. Work top-to-bottom. A task starts only when every task it `Depends on` has its **Definition of Done** ticked.
2. **Hard gate A:** nothing in Phase 1+ starts until every Phase 0 box is ticked. You do not build on an uncommitted, half-migrated tree.
3. **Hard gate B:** no Phase 5–10 task (design system, landing, portals, QA, deploy) may be marked done while any Phase 1 box is unticked. The privilege-escalation hole in `middleware.ts` ships with every feature built on top of it.
4. "Test before proceeding" is a gate, not a suggestion: the next task does not start until those tests pass.
5. Tick "implemented" subtask boxes as you go; tick **Definition of Done** only after the task's tests pass.

## Table of Contents

- [Phase 0 — Stabilize the Migration](#phase-0--stabilize-the-migration)
- [Phase 1 — Security & Auth Hardening (blocking)](#phase-1--security--auth-hardening-blocking)
- [Phase 2 — Database & Domain Model Finalization](#phase-2--database--domain-model-finalization)
- [Phase 3 — Core API Layer](#phase-3--core-api-layer)
- [Phase 4 — Matching Engines](#phase-4--matching-engines)
- [Phase 5 — Design System (glass × clay × minimalist)](#phase-5--design-system-glass--clay--minimalist)
- [Phase 6 — Hero / Landing Page](#phase-6--hero--landing-page)
- [Phase 7 — Student Portal](#phase-7--student-portal)
- [Phase 8 — Placement Admin Portal](#phase-8--placement-admin-portal)
- [Phase 9 — Cross-cutting QA & Hardening](#phase-9--cross-cutting-qa--hardening)
- [Phase 10 — Deployment Readiness](#phase-10--deployment-readiness)

---

## Phase 0 — Stabilize the Migration

Everything below blocks all later phases. Order inside this phase matters: secrets are removed **before** the big commit.

- [x] **Task 0.1 — Secret hygiene: Firebase key & env files**
  - Depends on: none
  - **Goal:** No credential file can ever be committed; the exposed service-account key is removed and rotated.
  - **How to build:**
    - [x] 1. Add to `.gitignore` under the secrets section: `peersphere-1be33-firebase-adminsdk-fbsvc-d6754d5265.json` and a catch-all `*-adminsdk-*.json`.
    - [x] 2. Verify nothing imports Firebase: `grep -ri firebase app lib services components` must return no code hits (verified true at audit time).
    - [x] 3. Delete `peersphere-1be33-firebase-adminsdk-fbsvc-d6754d5265.json` from disk.
    - [x] 4. Manual: revoke/rotate this service-account key in the Firebase console (project `peersphere-1be33`) — the key sat unprotected on disk.
    - [x] 5. Confirm `.env` is untracked: `git check-ignore -v .env` matches `.gitignore:12`.
  - **Test before proceeding:**
    - `git status --porcelain | grep -i adminsdk` → empty. `git check-ignore .env` → exits 0. A dummy file `test-adminsdk-x.json` at root shows as ignored, then delete it.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 0.2 — Delete dead files and mock fixtures**
  - Depends on: none
  - **Goal:** Repo contains no unused mock data or filesystem junk.
  - **How to build:**
    - [x] 1. Confirm `data/` is unreferenced: `grep -rn "from '@/data" app components services lib hooks context` → no hits (verified true at audit time).
    - [x] 2. Delete `data/index.ts`, `data/students.ts`, `data/jobs.ts` and the `data/` directory.
    - [x] 3. Delete the stray `nul` file at repo root (Windows redirect artifact): `Remove-Item -LiteralPath .\nul` (PowerShell; plain `del nul` fails on the reserved name).
    - [x] 4. Remove any orphaned mock-only types in `types/index.ts` flagged by the typecheck in step 5 (only if now unused).
    - [x] 5. Run `npx tsc --noEmit` — 0 errors.
  - **Test before proceeding:**
    - `npx tsc --noEmit` → 0 errors; `ls data nul` → both gone.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 0.3 — Prune Express-era dependencies**
  - Depends on: 0.2
  - **Goal:** `package.json` contains only dependencies the unified Next.js app actually uses.
  - **How to build:**
    - [x] 1. Verify no imports remain: `grep -rn "from 'express\|helmet\|cors\|morgan\|multer\|compression\|express-rate-limit" app lib services --include="*.ts" --include="*.tsx"` → no hits.
    - [x] 2. `npm uninstall express helmet cors morgan multer compression express-rate-limit`.
    - [x] 3. `npm uninstall @types/express @types/cors @types/morgan @types/multer @types/compression`.
    - [x] 4. Audit remaining suspects the same way: `axios` (frontend uses fetch in `lib/api-client.ts`?), `uuid`, `dotenv` — remove each only if `grep` shows zero imports.
    - [x] 5. `npm install && npx tsc --noEmit && npm run build`.
  - **Test before proceeding:**
    - `npm run build` succeeds; `npm run lint` → 0 errors; app boots with `npm run dev` and `/auth` login works against the seeded DB.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 0.4 — Remove legacy duplicate modules**
  - Depends on: 0.3
  - **Goal:** No dead Express-era code paths remain; exactly one auth-helper story survives to Phase 1.
  - **How to build:**
    - [x] 1. `grep -rn "hooks/useApi\|useApi" app components context --include="*.tsx" --include="*.ts"` — if unreferenced, delete `hooks/useApi.ts` and drop its export from `hooks/index.ts`.
    - [x] 2. `grep -rn "lib/auth/utils\|auth/utils" app lib services --include="*.ts"` — if unreferenced, delete `lib/auth/utils.ts` (duplicate `jsonwebtoken` impl with fallback secret `'dev-jwt-secret-change-in-production'` at line 16). If referenced, migrate callers to `lib/auth.ts`/`middleware.ts` helpers first, then delete.
    - [x] 3. Re-check `hooks/index.ts`, `hooks/useAuth.ts` still compile.
    - [x] 4. `npx tsc --noEmit` — 0 errors.
  - **Test before proceeding:**
    - `grep -rn "JWT_SECRET" --include="*.ts" .` (excluding node_modules) shows exactly two remaining definition sites: `middleware.ts` and `app/api/v1/auth/route.ts` (both fixed in Phase 1).
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 0.5 — Commit the migration**
  - Depends on: 0.1, 0.2, 0.3, 0.4
  - **Goal:** Working tree is clean; the unified app exists in git history, old split `backend/`/`frontend/` deletions included.
  - **How to build:**
    - [x] 1. `git status --porcelain` — review the full list once; confirm no `adminsdk` file, no `.env`, no `uploads/` content is staged-able (all ignored).
    - [x] 2. `git add -A`.
    - [x] 3. `git diff --cached --stat` — sanity-check: old `backend/*` and `frontend/*` show as deletions, unified `app/`, `lib/`, `prisma/` etc. as adds/modifications.
    - [x] 4. Commit with message: `chore: complete unified Next.js migration — remove split backend/frontend, dead deps, mock data`.
    - [x] 5. `git status` → clean.
  - **Test before proceeding:**
    - `git status --porcelain` → empty. `git show --stat HEAD` lists the `backend/` and `frontend/` deletions.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 0.6 — Test infrastructure (Jest)**
  - Depends on: 0.5
  - **Goal:** `npm test` runs a real Jest suite; every later phase's test gate has machinery to run on.
  - **How to build:**
    - [x] 1. Create `jest.config.ts`: preset `ts-jest`, `testEnvironment: 'node'`, `moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' }` (mirror `tsconfig.json` paths), `testMatch: ['**/__tests__/**/*.test.ts']`.
    - [x] 2. Create `__tests__/smoke.test.ts` importing `checkEligibility` from `@/lib/engines/eligibility.engine` and asserting it returns a status for a trivial input (proves TS + path mapping + engine imports work).
    - [x] 3. Add `.env.test` (gitignored via existing `.env.*` rule) with `DATABASE_URL` pointing at a disposable `peersphere_test` database for later integration tests.
    - [x] 4. Document in `README.md` Scripts table: `npm test`, `npm run test:watch`.
    - [x] 5. Commit.
  - **Test before proceeding:**
    - `npm test` → 1 suite, 1+ tests, green, exit code 0.
  - [x] **Definition of Done** — implemented AND tests above pass

---

## Phase 1 — Security & Auth Hardening (blocking)

**Hard gate B: no Phase 5–10 task may be ticked while any box below is open.** The bug in Task 1.1 is a live, confirmed privilege escalation.

- [x] **Task 1.1 — Fix header-spoofing privilege escalation in `middleware.ts`**
  - Depends on: 0.6
  - **Goal:** No request — authenticated or not, public route or not — can reach a handler carrying client-supplied `x-user-id`/`x-user-role` headers.
  - **How to build:**
    - [x] 1. In `middleware.ts middleware()`: at the top, build `requestHeaders = new Headers(request.headers)` and immediately `requestHeaders.delete('x-user-id'); requestHeaders.delete('x-user-role')` — for **every** request, before the public-route check.
    - [x] 2. Replace the path-only `PUBLIC_ROUTES` (lines 20–24) with method-aware entries: `POST /api/v1/auth`, `POST /api/v1/auth/refresh`, `GET /api/v1/jobs` (exact). Everything else under `/api/v1/*` requires a valid token regardless of method.
    - [x] 3. Public branch: return `NextResponse.next({ request: { headers: requestHeaders } })` — stripped headers, no auth.
    - [x] 4. Authenticated branch: after `verifyToken` succeeds, `set` the two headers from the verified payload onto the already-stripped `requestHeaders` (existing logic at lines 143–152 keeps working, now on a sanitized base).
    - [x] 5. Audit every handler that calls `getAuthUser` on a route that was public-by-path (`app/api/v1/jobs/route.ts:60` POST) — with step 2 these now receive 401 from middleware before the handler runs; no handler change needed, but confirm none also parses auth headers directly.
    - [x] 6. Write `__tests__/security/middleware.test.ts` exercising `middleware()` with mock `NextRequest`s (see test gate).
  - **Test before proceeding:**
    - Regression test: unauthenticated `POST /api/v1/jobs` with headers `x-user-id: attacker`, `x-user-role: PLACEMENT_ADMIN` → **401** (middleware) — never creates a job.
    - `GET /api/v1/jobs` with the same forged headers → 200, but the forwarded request contains **no** `x-user-*` headers.
    - Valid STUDENT token on `POST /api/v1/jobs` → 403 (role check in handler). Valid ADMIN token → 2xx.
    - Manual curl reproduction of the original exploit against `npm run dev` → 401.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 1.2 — Remove all hardcoded JWT fallback secrets**
  - Depends on: 1.1
  - **Goal:** The app refuses to boot without real secrets; no `|| 'your-secret-key'` anywhere.
  - **How to build:**
    - [x] 1. Create `lib/auth/env.ts` exporting `JWT_SECRET` and `JWT_REFRESH_SECRET` read from `process.env`, throwing `new Error('JWT_SECRET is not set')` at module load when missing or shorter than 32 chars.
    - [x] 2. Replace `middleware.ts:13` (`|| 'your-secret-key'`) with the import from `lib/auth/env.ts`.
    - [x] 3. Replace `app/api/v1/auth/route.ts:25–26` (both fallbacks) the same way.
    - [x] 4. Confirm `lib/auth/utils.ts` is already deleted (Task 0.4); if it survived, its line 16 fallback goes too.
    - [x] 5. Update `.env.example` with `JWT_SECRET=` and `JWT_REFRESH_SECRET=` entries plus a generation hint (`openssl rand -hex 32`); ensure real `.env` has strong values.
  - **Test before proceeding:**
    - `grep -rn "your-secret-key\|dev-jwt-secret\|process.env.JWT[^ ]* ||" --include="*.ts" app lib middleware.ts` → zero hits.
    - Unit test: importing `lib/auth/env.ts` with `JWT_SECRET` deleted from env throws. With it set → exports the value.
    - `npm run dev` with `.env` present boots; login round-trip still works.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 1.3 — Consolidate JWT sign/verify into one module**
  - Depends on: 1.2
  - **Goal:** Exactly one JWT implementation (Web Crypto HS256 — Edge-safe) signs and verifies every token.
  - **How to build:**
    - [x] 1. Create `lib/auth/jwt.ts`: `signToken(payload, secret, expiresInSec)` and `verifyToken(token, secret): AuthPayload | null` using Web Crypto HMAC-SHA256 (move/adapt the verifier already in `middleware.ts:46–94`, add a signer with base64url encoding and `exp` claim). Web Crypto is chosen because `middleware.ts` runs on the Edge runtime where `jsonwebtoken` cannot.
    - [x] 2. Rewrite `app/api/v1/auth/route.ts` `signAccess`/`signRefresh` to use `lib/auth/jwt.ts`; delete its local `jwt.sign` usage.
    - [x] 3. Fix the import inversion: `app/api/v1/auth/refresh/route.ts:11` currently imports secrets/signers from `../route` — repoint it at `lib/auth/jwt.ts` + `lib/auth/env.ts`; delete the re-exports at `app/api/v1/auth/route.ts:105`.
    - [x] 4. `middleware.ts` imports `verifyToken` from `lib/auth/jwt.ts`; delete its inline copy.
    - [x] 5. `npm uninstall jsonwebtoken @types/jsonwebtoken bcryptjs`-check: remove `jsonwebtoken` + `@types/jsonwebtoken` only (keep `bcryptjs` — password hashing still uses it).
    - [x] 6. Unit tests in `__tests__/auth/jwt.test.ts`: sign→verify round-trip, tampered signature → null, expired `exp` → null, non-HS256 header → null.
  - **Test before proceeding:**
    - `__tests__/auth/jwt.test.ts` green. `grep -rn "jsonwebtoken" --include="*.ts" app lib` → zero. Full login → authed request → refresh → authed request flow works in `npm run dev`.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 1.4 — Rate-limit `POST /api/v1/auth`**
  - Depends on: 1.3
  - **Goal:** Credential stuffing against login is throttled.
  - **How to build:**
    - [x] 1. Create `lib/auth/rate-limit.ts`: in-memory sliding-window limiter keyed by IP (`Map<string, number[]>`), `checkRateLimit(key, max = 10, windowMs = 60_000): boolean`, with periodic pruning. (In-memory is acceptable for single-instance deploys; note Redis upgrade path in a comment.)
    - [x] 2. In `app/api/v1/auth/route.ts` POST: derive IP from `x-forwarded-for` (first hop) or `request.headers`, call the limiter before password verification; on limit return 429 `{ code: 'RATE_LIMITED' }` via a new helper in `lib/api/response.ts`.
    - [x] 3. Apply the same limiter (higher threshold, e.g. 30/min) to `POST /api/v1/auth/refresh`.
    - [x] 4. Unit test the limiter: 10 calls pass, 11th fails, passes again after window expiry (fake timers).
  - **Test before proceeding:**
    - Unit tests green. Manual: 11 rapid failed logins via curl → 11th returns 429; correct login from a different key still succeeds.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 1.5 — Auth regression suite & gate sign-off**
  - Depends on: 1.1, 1.2, 1.3, 1.4
  - **Goal:** One command proves the whole auth surface is sound; hard gate B is formally lifted.
  - **How to build:**
    - [x] 1. Consolidate into `__tests__/security/`: header-spoof regression (1.1), env-throw (1.2), JWT round-trips (1.3), rate limiting (1.4).
    - [x] 2. Add negative-path tests: expired access token → 401; STUDENT token on admin route (`GET /api/v1/students`) → 403; malformed Bearer header → 401.
    - [x] 3. Add `npm run test:security` script scoped to `__tests__/security`.
    - [x] 4. Commit with message referencing the vulnerability fix.
  - **Test before proceeding:**
    - `npm run test:security` → all green, includes the forged-header regression test by name.
  - [x] **Definition of Done** — implemented AND tests above pass. **Ticking this box lifts hard gate B.**

---

## Phase 2 — Database & Domain Model Finalization

- [x] **Task 2.1 — Constraint & index review of `prisma/schema.prisma`**
  - Depends on: 1.5
  - **Goal:** Every hot query path is indexed and every invariant is a DB constraint, not just app logic.
  - **How to build:**
    - [x] 1. Review the 12 models (User, Student, Skill, StudentSkillEvidence, ResumeVersion, Job, JobVersion, JobRequirement, Evaluation, RequirementMatch, Recommendation, Application, ReviewOverride, AuditEvent) against actual query patterns in `lib/services/*.ts`.
    - [x] 2. Add `@@index` where services filter/sort without one: candidates `Evaluation(jobVersionId, overallScore)`, `Application(jobId, status)`, `AuditEvent(resourceType, resourceId)`, `Evaluation(studentId, createdAt)` — confirm each against the service code before adding.
    - [x] 3. Add `@@unique([studentId, jobVersionId, snapshotHash])` to `Evaluation` if the idempotent queue in `lib/services/evaluations.service.ts` relies on it logically but not structurally.
    - [x] 4. Verify existing uniques still correct: `applications @@unique([studentId, jobId])`, `job_versions @@unique([jobId, version])`, `student_skill_evidence @@unique([studentId, skillId])`.
    - [x] 5. `npx prisma format && npx prisma validate`.
  - **Test before proceeding:**
    - `npx prisma validate` → OK; `npx prisma db push` on the dev DB applies cleanly; app smoke (login, jobs list) still works.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 2.2 — Real migrations instead of `db push`**
  - Depends on: 2.1
  - **Goal:** Schema history is reproducible via `prisma migrate deploy` on a blank database.
  - **How to build:**
    - [x] 1. `npx prisma migrate dev --name init` to baseline the current schema into `prisma/migrations/`.
    - [x] 2. Create a scratch DB `peersphere_migratecheck`; run `npx prisma migrate deploy` against it with a temporary `DATABASE_URL`.
    - [x] 3. `npx prisma migrate status` → in sync on both dev and scratch DBs.
    - [x] 4. Update `README.md` Quick Start: replace `prisma db push` with `prisma migrate deploy` (fresh) / `migrate dev` (development).
    - [x] 5. Drop the scratch DB.
  - **Test before proceeding:**
    - Fresh DB → `migrate deploy` → `db:seed` → `npm run dev` login works end-to-end.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 2.3 — Verify idempotent seed**
  - Depends on: 2.2
  - **Goal:** `npm run db:seed` is safe to run repeatedly and produces the documented dataset.
  - **How to build:**
    - [x] 1. Read `prisma/seed.ts`; confirm upsert keys (jobs by title+company, users by email, skills by canonicalName).
    - [x] 2. Run `npm run db:seed` twice in a row on the same DB.
    - [x] 3. Assert counts after both runs: 20 skills, 6 users, 5 students, 5 jobs, 7 applications, 7 evaluations (query via `npx prisma studio` or a count script).
    - [x] 4. Fix any duplicate-creating path found; re-run.
  - **Test before proceeding:**
    - Two consecutive seed runs → identical row counts; no unique-constraint errors; demo logins (`arjun.sharma@college.edu`, `placement@college.edu`) work.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 2.4 — Document the ER model**
  - Depends on: 2.1
  - **Goal:** `docs/03-database/` reflects the locked schema, including versioning and snapshot semantics.
  - **How to build:**
    - [x] 1. Update `docs/03-database/schema.md` to match `prisma/schema.prisma` exactly (enums, new indexes from 2.1).
    - [x] 2. Add a Mermaid ER diagram covering the Job→JobVersion→JobRequirement and Evaluation→RequirementMatch/Recommendation chains.
    - [x] 3. Document the `Evaluation.inputSnapshot` + `snapshotHash` idempotency contract (what fields are hashed, what is excluded).
    - [x] 4. Document the `ResumeVersion.state` machine (UPLOADED→…→EXTRACTED/FAILED) and which states are terminal.
  - **Test before proceeding:**
    - Manual review: every model/enum in the doc exists in the schema and vice versa (diff by eye against `prisma/schema.prisma`).
  - [x] **Definition of Done** — implemented AND tests above pass

---

## Phase 3 — Core API Layer

Pattern for every task below: verify handler → Zod validation at the boundary → delegate to the existing `lib/services/*` module (reuse, don't rewrite) → integration tests in `__tests__/api/<group>.test.ts` that call the exported route handlers with constructed `NextRequest`s against the `peersphere_test` DB (`.env.test` from 0.6), seeding/truncating per suite.

- [x] **Task 3.1 — Auth routes (`app/api/v1/auth`, `auth/refresh`)**
  - Depends on: 2.3
  - **Goal:** Login and refresh are validated, rate-limited, and integration-tested.
  - **How to build:**
    - [x] 1. Confirm Zod schemas on both POST bodies (email format, password min length; `refreshSchema` exists — verify it rejects non-string tokens).
    - [x] 2. Confirm responses match `{ accessToken, refreshToken, user }` shape consumed by `lib/api-client.ts`.
    - [x] 3. Write `__tests__/api/auth.test.ts`: valid login → 200 + tokens verify against `lib/auth/jwt.ts`; wrong password → 401; unknown email → 401 (same error shape — no user enumeration); refresh with access token → 401; refresh with refresh token → new access token.
    - [x] 4. Ensure failed logins write an `AuditEvent` (add if missing, action `AUTH_LOGIN_FAILED`, no password in metadata).
  - **Test before proceeding:**
    - `__tests__/api/auth.test.ts` green against the test DB.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 3.2 — Student self-service routes (`students/me`, `me/skills`, `me/resumes`)**
  - Depends on: 3.1
  - **Goal:** A student can read/update their profile, manage skills, and upload/download resumes — all validated and tested.
  - **How to build:**
    - [x] 1. `students/me/route.ts` GET/PATCH: Zod on PATCH (cgpa 0–10 decimal, year int range); confirms `resumeVersions` included; profile-completeness recompute via `lib/services/students.service.ts`.
    - [x] 2. `me/skills/route.ts` GET/POST + `me/skills/[skillId]/route.ts` DELETE: POST validates skillId exists in taxonomy, proficiency/confidence 0–100; duplicate skill → 409 (unique `[studentId, skillId]`).
    - [x] 3. `me/resumes/route.ts` upload: enforce mime whitelist (PDF/DOCX) + size cap in `lib/services/resumes.service.ts`; checksum stored; download route streams with correct `Content-Disposition`.
    - [x] 4. Ownership checks: student A cannot fetch student B's resume by id (service filters by authed studentId).
    - [x] 5. `__tests__/api/students-me.test.ts` covering all of the above.
  - **Test before proceeding:**
    - Integration suite green, including the cross-student resume access test → 404/403.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 3.3 — Admin roster routes (`students`, `students/[id]`)**
  - Depends on: 3.2
  - **Goal:** Admin roster list/detail is role-gated, paginated, and tested.
  - **How to build:**
    - [x] 1. Confirm both handlers reject STUDENT role → 403.
    - [x] 2. Add/verify pagination + filter params (department, year, search) with Zod on query strings.
    - [x] 3. Detail route includes skills, latest resume state, evaluation summary (whatever `lib/services/students.service.ts` exposes — extend there, not in the handler).
    - [x] 4. `__tests__/api/students-admin.test.ts`: student token → 403; admin token → 200 with 5 seeded students; unknown id → 404.
  - **Test before proceeding:**
    - Suite green.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 3.4 — Jobs routes (`jobs`, `jobs/[jobId]`, `publish`, `close`, `apply`)**
  - Depends on: 3.3
  - **Goal:** Full job lifecycle (draft→publish→apply→close) is validated and tested, on top of the fixed middleware.
  - **How to build:**
    - [x] 1. `jobs/route.ts` GET (public): only PUBLISHED jobs for unauthenticated/student callers; DRAFT visible to admin only.
    - [x] 2. POST create: `createJobSchema` (Zod) validates version fields incl. minCgpa/maxBacklogs/deadline future date; admin-only (middleware now guarantees no forged headers — handler role check stays as defense in depth).
    - [x] 3. `publish`/`close` transitions: enforce legal `JobStatus` transitions in `lib/services/jobs.service.ts` (DRAFT→PUBLISHED→CLOSED; anything else → 409).
    - [x] 4. `apply/route.ts`: student-only; duplicate application → 409 (unique `[studentId, jobId]`); applying to non-PUBLISHED job → 409; triggers evaluation queue.
    - [x] 5. `__tests__/api/jobs.test.ts` covering lifecycle + the 1.1 regression case again at the integration level.
  - **Test before proceeding:**
    - Suite green; manual smoke: admin publishes seeded DRAFT job, student applies, application appears in admin list.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 3.5 — Applications routes (`applications`, `applications/[id]`)**
  - Depends on: 3.4
  - **Goal:** Application listing and status transitions follow the `ApplicationStatus` state machine.
  - **How to build:**
    - [x] 1. Define the legal transition map in `lib/services/applications.service.ts` (e.g. APPLIED→UNDER_REVIEW→SHORTLISTED→INTERVIEW_SCHEDULED→OFFER_EXTENDED→OFFER_ACCEPTED; REJECTED/WITHDRAWN as documented sinks) — reject illegal jumps with 409.
    - [x] 2. PATCH `[id]`: admin can transition any status; student can only WITHDRAW their own.
    - [x] 3. Every transition writes an `AuditEvent` (action `APPLICATION_STATUS_CHANGED`, old→new in metadata).
    - [x] 4. `__tests__/api/applications.test.ts`: legal chain passes; APPLIED→OFFER_ACCEPTED direct → 409; student transitioning another student's application → 403.
  - **Test before proceeding:**
    - Suite green including audit-event assertions.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 3.6 — Evaluations routes (`evaluations`, `evaluations/queue`, `evaluations/[evaluationId]`)**
  - Depends on: 3.5
  - **Goal:** Evaluation queueing is idempotent by snapshot hash and detail responses expose full explainability.
  - **How to build:**
    - [x] 1. Verify `queue` route: same student+jobVersion+unchanged snapshot → returns existing evaluation, does not duplicate (uses `snapshotHash` from `lib/services/evaluations.service.ts`).
    - [x] 2. Changed student skills → new snapshot hash → new evaluation row.
    - [x] 3. Detail route returns `requirementMatches` (with explanations), `recommendations`, scores, `requiresReview`/`reviewNote`.
    - [x] 4. Student can only read their own evaluations; admin reads all.
    - [x] 5. `__tests__/api/evaluations.test.ts`: idempotency (queue twice → 1 row), snapshot-change (mutate a skill, queue → 2 rows), access control.
  - **Test before proceeding:**
    - Suite green; DB row-count assertions prove idempotency.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 3.7 — Overrides & audit routes (`overrides`, `evaluations/[id]/override(s)`, `audit-log`)**
  - Depends on: 3.6
  - **Goal:** Admin overrides are append-only, reasoned, and fully audited.
  - **How to build:**
    - [x] 1. POST override: Zod requires `decision` ∈ {shortlist, reject, review, promote} and non-empty `reason`; admin-only.
    - [x] 2. Confirm append-only: no PATCH/DELETE handlers exist on overrides; listing returns chronological history.
    - [x] 3. Each override writes an `AuditEvent` via `lib/services/overrides.service.ts`.
    - [x] 4. `audit-log` route: admin-only, paginated, filterable by resourceType/resourceId.
    - [x] 5. `__tests__/api/overrides.test.ts`: missing reason → 400; student → 403; override then list shows entry + audit event exists.
  - **Test before proceeding:**
    - Suite green.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 3.8 — Analytics & reports routes (`analytics/placement-stats`, `analytics/skill-gaps`, `reports`)**
  - Depends on: 3.7
  - **Goal:** Aggregate endpoints return correct numbers computed from the seeded dataset.
  - **How to build:**
    - [x] 1. Verify `lib/services/analytics.service.ts` aggregations against hand-computed values from the seed (e.g. applications by status, avg match score, top missing skills).
    - [x] 2. Admin-only on all three; Zod on pagination/filters for `reports`.
    - [x] 3. Empty-DB behavior: zeros/empty arrays, not 500s (test on truncated test DB).
    - [x] 4. `__tests__/api/analytics.test.ts` with exact expected numbers from seed data.
  - **Test before proceeding:**
    - Suite green with hand-verified expected values, plus the empty-DB case.
  - [x] **Definition of Done** — implemented AND tests above pass

---

## Phase 4 — Matching Engines

The engines are pure functions with **zero current test coverage**. Each task's gate is a full unit suite — no DB needed.

- [x] **Task 4.1 — `lib/engines/eligibility.engine.ts` unit suite**
  - Depends on: 0.6
  - **Goal:** Every eligibility rule and the status-precedence order is pinned by tests.
  - **How to build:**
    - [x] 1. Create `__tests__/engines/eligibility.test.ts`.
    - [x] 2. Precedence: hard failure + null CGPA → INELIGIBLE beats PENDING/CONDITIONAL; null CGPA with all else passing → the documented PENDING/CONDITIONAL outcome (pin whichever the code does; fix code if it contradicts the docstring at lines 38–46).
    - [x] 3. Boundary cases: CGPA exactly equal to minCgpa → pass; backlogs exactly equal to maxBacklogs → pass; one over → fail.
    - [x] 4. Empty `allowedDepartments`/`allowedPrograms` → treated as "no restriction" (passes).
    - [x] 5. Case-insensitivity: `"computer science"` student vs `"Computer Science"` allowlist → pass.
    - [x] 6. Assert `failedRules`/`passedRules`/`conditionalReasons` message content for at least one case each (explainability contract).
  - **Test before proceeding:**
    - Suite green; `npx jest --coverage --collectCoverageFrom=lib/engines/eligibility.engine.ts` → ≥90% branches.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 4.2 — `lib/engines/matching.engine.ts` unit suite**
  - Depends on: 4.1
  - **Goal:** Scoring, thresholds, and review flags are locked against regression.
  - **How to build:**
    - [x] 1. Create `__tests__/engines/matching.test.ts`.
    - [x] 2. Degenerate inputs: zero requirements → overallScore 100, coverage 100; zero required (all optional) → same; empty studentSkills → all MISSING, score 0.
    - [x] 3. All-STRONG (exact matches, confidence ≥75) → score 100; all-MISSING → 0; mixed with weights → hand-computed weighted score (e.g. weight 2.0 STRONG + weight 1.0 MISSING → 67).
    - [x] 4. Confidence boundaries: exact match at confidence 75 → STRONG; 74 → PARTIAL; 40 → PARTIAL; 39 → MISSING (thresholds at lines 166–197).
    - [x] 5. Match methods: alias match → STRONG-capable; substring match → PARTIAL always; alias collision (duplicate token in name+aliases) → `requiresReview` true via `hasConflictingAliases`.
    - [x] 6. `requiresReview` when confidenceScore <60; `matchSummary` contains score and coverage figures.
  - **Test before proceeding:**
    - Suite green; ≥90% branch coverage on `matching.engine.ts`.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 4.3 — `lib/engines/skillgap.engine.ts` unit suite**
  - Depends on: 4.2
  - **Goal:** Gap prioritization and roadmap output shape are pinned.
  - **How to build:**
    - [x] 1. Create `__tests__/engines/skillgap.test.ts`.
    - [x] 2. Category detection: representative skill names hit each `CATEGORY_KEYWORDS` bucket (programming, cloud, ml, softskills, …); unknown skill → `general`.
    - [x] 3. Priority: MISSING required high-weight skill → `high`; optional/PARTIAL → lower priority (pin actual rules from the code).
    - [x] 4. Output contract: every result has 3–5 `steps`, `potentialLift` within 0–30, `estimatedWeeks` > 0.
    - [x] 5. No gaps (all STRONG) → empty result array.
  - **Test before proceeding:**
    - Suite green; combined `npx jest --coverage --collectCoverageFrom="lib/engines/**"` → ≥80% overall (Phase 9 target already met for engines).
  - [x] **Definition of Done** — implemented AND tests above pass

---

## Phase 5 — Design System (glass × clay × minimalist)

**Blocked until Task 1.5 is ticked (hard gate B).** The hybrid is a deliberate split, not three competing styles:
- **Minimalist** governs layout: generous whitespace, 2–3 type sizes per screen, one accent color, no decorative clutter.
- **Glassmorphism** only on *overlay/elevated* surfaces: modals, nav, dropdowns, floating cards — translucent bg, backdrop-blur, thin light border, soft shadow. (Existing: `components/ui/GlassCard/Button/Badge/Dialog/Input/Tabs` + `styles/glass.css`.)
- **Claymorphism** only on *interactive/tactile* elements: primary buttons, toggles, badges, chips — soft inflated shape, dual-tone shadow (light top-left, dark bottom-right), rounded, no harsh edges. (Nothing exists yet.)

- [x] **Task 5.1 — Clay tokens in `styles/tokens.css`**
  - Depends on: 1.5
  - **Goal:** All clay styling derives from variables that coexist with the existing glass tokens, in both themes.
  - **How to build:**
    - [x] 1. Read `styles/tokens.css`; add a `/* Clay surface */` block: `--clay-bg`, `--clay-shadow-light`, `--clay-shadow-dark`, `--clay-radius` (larger than glass radius), `--clay-shadow` composite (`inset` highlights + dual outer shadows).
    - [x] 2. Define both light and dark theme values (mirror however glass tokens switch themes today — `ThemeSwitcher.tsx` + `lib/theme-context.tsx`).
    - [x] 3. Confirm the single accent color token is shared by glass and clay (minimalist rule: one accent).
    - [x] 4. Document each token with a one-line comment stating which surface class consumes it.
  - **Test before proceeding:**
    - Manual: a scratch element styled with the tokens renders correctly in light and dark via ThemeSwitcher; no unresolved `var(--…)` in devtools.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 5.2 — `styles/clay.css` surface classes**
  - Depends on: 5.1
  - **Goal:** Reusable `.clay`, `.clay-interactive` (hover/active press effect), `.clay-chip` classes exist, parallel to `glass.css`.
  - **How to build:**
    - [x] 1. Create `styles/clay.css` modeled on `styles/glass.css` structure: base `.clay` (bg, radius, dual-tone shadow), `.clay-interactive` (hover lift, `:active` pressed inset shadow), `.clay-chip` (compact variant).
    - [x] 2. Import it in `app/globals.css` next to the existing glass import.
    - [x] 3. Respect `prefers-reduced-motion` for the press transition.
    - [x] 4. Verify no specificity clash with `.glass*` classes.
  - **Test before proceeding:**
    - Manual: scratch page shows clay surface with correct dual-tone shadow both themes; press animation visible; `npm run build` clean.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 5.3 — Primitives: build `<ClayButton>`, audit `<GlassCard>`**
  - Depends on: 5.2
  - **Goal:** The two flagship primitives exist in isolation and follow the surface rules.
  - **How to build:**
    - [x] 1. Create `components/ui/ClayButton.tsx` mirroring `GlassButton.tsx`'s prop API (`variant`, `size`, `disabled`, `type`) so call sites can swap 1:1; uses `.clay-interactive`.
    - [x] 2. Audit `components/ui/GlassCard.tsx` against the rules (translucency, blur, thin border, soft shadow — elevated surfaces only); adjust to tokens if hardcoded values exist.
    - [x] 3. Audit remaining `Glass*` components: `GlassButton` becomes secondary/tertiary actions only (primary actions move to ClayButton in Phases 6–8); `GlassBadge`/chips are candidates for clay variants — add `ClayBadge`/`SkillChip` clay variant if `components/product/SkillChip.tsx` styling warrants it.
    - [x] 4. Create a dev-only preview route `app/dev/design/page.tsx` rendering every primitive in both themes side by side (excluded from production nav; note removal in Phase 10).
    - [x] 5. Keyboard/focus states: visible focus ring on ClayButton meeting contrast on clay bg.
  - **Test before proceeding:**
    - Manual on `/dev/design`: all primitives render both themes; ClayButton keyboard-focusable with visible ring; disabled state distinct. `npx tsc --noEmit` clean.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 5.4 — Usage rules documentation**
  - Depends on: 5.3
  - **Goal:** An engineer (or future task) can decide glass vs clay vs plain without asking.
  - **How to build:**
    - [x] 1. Create `docs/frontend/design-system.md`: the three-way split (minimalist layout / glass overlays / clay interactives), with a decision table (element type → surface).
    - [x] 2. List the token inventory from 5.1 and which class consumes each.
    - [x] 3. Anti-patterns section: no glass-on-glass stacking >2 deep, no clay for static content, max one accent color per screen, 2–3 type sizes per screen.
    - [x] 4. Link from `docs/frontend/README.md`.
  - **Test before proceeding:**
    - Review pass: every rule in the doc is demonstrated by `/dev/design`; no rule contradicts an existing component.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 5.5 — Visual QA sign-off**
  - Depends on: 5.4
  - **Goal:** The system is verified before any page consumes it — no page work starts on unsigned primitives.
  - **How to build:**
    - [x] 1. Create checklist in `docs/frontend/design-system.md#qa`: both themes × {ClayButton all variants/sizes/states, GlassCard, GlassDialog over content, chips}, contrast ≥4.5:1 for text on both surface types (check with devtools contrast picker), 3 breakpoints (375 / 768 / 1280).
    - [x] 2. Execute the checklist on `/dev/design`; record results inline (date + pass/fail per row).
    - [x] 3. Fix failures; re-run until clean.
  - **Test before proceeding:**
    - Checklist fully ticked with all rows passing, committed to the doc.
  - [x] **Definition of Done** — implemented AND tests above pass. **Phases 6–8 may not begin before this box.**

---

## Phase 6 — Hero / Landing Page

Reworks the existing `app/page.tsx` (it already has a hero + GlassCard sections) onto the Phase 5 system.

- [x] **Task 6.1 — Hero section**
  - Depends on: 5.5
  - **Goal:** Above-the-fold hero with headline, subheadline, and a ClayButton primary CTA, minimalist layout.
  - **How to build:**
    - [x] 1. Rework the hero block in `app/page.tsx`: keep headline/subheadline copy, replace the primary CTA (currently `GlassButton`) with `<ClayButton>` linking to `/auth`; keep Sign-In as `GlassButton variant="secondary"` in the navbar.
    - [x] 2. Enforce type scale: exactly 3 sizes above the fold (display, body, badge).
    - [x] 3. Reserve layout space for all hero elements (fixed min-heights) so nothing shifts on font/hydration load.
    - [x] 4. Verify both themes.
  - **Test before proceeding:**
    - Manual at 375/768/1280px: no horizontal scroll, CTA tappable ≥44px, both themes correct. DevTools performance: no layout shift entries on load for the hero.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 6.2 — Social-proof / stats strip**
  - Depends on: 6.1
  - **Goal:** A stats strip (e.g. placement rate, students matched, skills tracked) renders from constants, styled as clay chips or minimalist figures.
  - **How to build:**
    - [x] 1. Add a stats strip section in `app/page.tsx` (static constants for now — real analytics wiring is not a landing-page dependency).
    - [x] 2. Use `components/product/StatCard.tsx` if it fits the system, else simple minimalist figures; no glass here (not an overlay).
    - [x] 3. Responsive: 1-column stack at 375px, row at 768px+.
  - **Test before proceeding:**
    - Manual responsive check at 3 breakpoints, both themes.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 6.3 — Feature overview grid**
  - Depends on: 6.2
  - **Goal:** 3–6 feature cards (matching, eligibility, skill gaps, analytics) in a `<GlassCard>` grid.
  - **How to build:**
    - [x] 1. Rework existing feature section with `<GlassCard>` per feature, `lucide-react` icon + 1-line description each.
    - [x] 2. Grid: 1 col mobile / 2 col tablet / 3 col desktop.
    - [x] 3. Keep copy terse; no card exceeds 3 lines of body text.
  - **Test before proceeding:**
    - Manual: grid reflows correctly at 3 breakpoints; glass legible over the page background in both themes.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 6.4 — Footer + landing quality gate**
  - Depends on: 6.3
  - **Goal:** Complete landing page passes Lighthouse thresholds.
  - **How to build:**
    - [x] 1. Add footer: product name, links (Sign in, docs), copyright — minimalist, no glass/clay.
    - [x] 2. `npm run build && npm run start`; run Lighthouse (Chrome devtools) on `/` in production mode.
    - [x] 3. Fix flagged issues (image sizing, contrast, unused JS) until thresholds met.
  - **Test before proceeding:**
    - Lighthouse on production build: Performance ≥90, Accessibility ≥95, CLS reported as 0 (or <0.02). Responsive check at 375/768/1280.
  - [x] **Definition of Done** — implemented AND tests above pass

---

## Phase 7 — Student Portal

All 8 pages live under `app/(student)/student/`. Pattern per page task: wire to the real API via `services/student-api.ts` (no mock remnants — `data/` was deleted in 0.2), apply Phase 5 surfaces (clay for actions, glass for overlays/cards), loading/empty/error states from `components/states/`, then a flow test. Login as `arjun.sharma@college.edu` / `student123` on the seeded DB for manual gates.

- [x] **Task 7.1 — Playwright setup**
  - Depends on: 5.5
  - **Goal:** `npx playwright test` runs against a dev server with the seeded DB; auth helper exists.
  - **How to build:**
    - [x] 1. Create `playwright.config.ts`: `webServer: { command: 'npm run dev', port: 3000, reuseExistingServer: true }`, testDir `e2e/`.
    - [x] 2. Create `e2e/helpers/auth.ts`: login helper via UI (or storageState fixture) for both demo accounts.
    - [x] 3. Smoke spec `e2e/smoke.spec.ts`: `/` renders hero headline; `/auth` renders the login form.
    - [x] 4. Add `.gitignore` entries already present for `playwright-report/`, `test-results/` — verify.
    - [x] 5. Add `npm run e2e` script.
  - **Test before proceeding:**
    - `npm run e2e` → smoke spec green locally.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 7.2 — Student dashboard (`student/page.tsx`)**
  - Depends on: 7.1
  - **Goal:** Dashboard shows real profile completeness, active applications, latest match highlights from the API.
  - **How to build:**
    - [x] 1. Wire to `GET /api/v1/students/me` + `students/me/applications` via `services/student-api.ts` (add missing service functions there, not inline fetch).
    - [x] 2. Stat tiles via `StatCard`; primary actions (e.g. "Browse jobs") as `<ClayButton>`.
    - [x] 3. Loading skeletons (`components/ui/Skeleton.tsx`), empty state for zero applications, error state with retry.
    - [x] 4. Confirm `ProtectedRoute`/`AuthContext` guard redirects unauthenticated visitors to `/auth`.
  - **Test before proceeding:**
    - Manual: seeded student sees their real numbers (cross-check against DB). Logged-out visit to `/student` → redirected to `/auth`. Playwright spec: dashboard renders name + ≥1 stat after login.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 7.3 — Jobs list + job detail (`student/jobs`, `student/jobs/[id]`)**
  - Depends on: 7.2
  - **Goal:** Student browses published jobs, opens a detail view with eligibility + requirements, and can apply.
  - **How to build:**
    - [x] 1. List: `GET /api/v1/jobs` → `JobCard` grid; filters (type, work mode) client-side or query params.
    - [x] 2. Detail: `GET /api/v1/jobs/[jobId]` — title/company/deadline, eligibility constraints, requirement list with `SkillChip`s.
    - [x] 3. Apply button (`ClayButton`) → `POST /api/v1/jobs/[jobId]/apply`; already-applied and past-deadline states disable it with reason text.
    - [x] 4. Success → `Toast` + status change; duplicate apply shows the 409 message gracefully.
  - **Test before proceeding:**
    - Manual: apply to a seeded job → appears in `/student/applications`; second apply attempt blocked. Playwright: list renders ≥1 seeded job; detail page shows requirements.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 7.4 — Match detail (`student/match`)**
  - Depends on: 7.3
  - **Goal:** Student sees explainable match results — score, coverage, strong/partial/missing skills, review flag — from real evaluations.
  - **How to build:**
    - [x] 1. Wire to `GET /api/v1/students/me/evaluations` (+ detail via `evaluations/[evaluationId]` on selection).
    - [x] 2. Render `MatchScore`, per-requirement explanations from `requirementMatches`, `HumanReviewBanner` when `requiresReview`.
    - [x] 3. Skill states as chips: strong/partial/missing visually distinct with accessible labels (not color-only).
    - [x] 4. Empty state when no evaluations exist yet.
  - **Test before proceeding:**
    - Manual: seeded evaluation's score/summary on screen matches the DB row exactly. Playwright: match page renders a score element after login.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 7.5 — Skill gaps + recommendations (`student/skill-gaps`, `student/recommendations`)**
  - Depends on: 7.4
  - **Goal:** Both learning-roadmap pages render engine-generated recommendations from real evaluation data.
  - **How to build:**
    - [x] 1. Wire skill-gaps to evaluation `recommendations` (via the evaluations detail payload or a dedicated service call in `services/student-api.ts`).
    - [x] 2. `SkillGapCard`/`RecommendationCard` show priority, reason, ordered steps, potentialLift, estimatedWeeks.
    - [x] 3. Priority sort (high first); priority badges as clay chips.
    - [x] 4. Empty states for students with no gaps/evaluations.
  - **Test before proceeding:**
    - Manual: recommendations shown equal the seeded evaluation's `Recommendation` rows. Playwright: page renders ≥1 recommendation card for the seeded student.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 7.6 — Applications (`student/applications`)**
  - Depends on: 7.3
  - **Goal:** Student tracks all applications with live status and can withdraw.
  - **How to build:**
    - [x] 1. Wire to `GET /api/v1/students/me/applications` (includes latest evaluation per the API).
    - [x] 2. Status timeline/badge per `ApplicationStatus`; withdraw action → `PATCH /api/v1/applications/[id]` (WITHDRAWN) with a `GlassDialog` confirm.
    - [x] 3. Withdrawn/rejected rows visually de-emphasized; empty state present.
  - **Test before proceeding:**
    - Manual: withdraw a seeded application → status updates in UI and DB; withdraw option gone afterward. Playwright: applications table renders seeded rows.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 7.7 — Profile + resume management (`student/profile`)**
  - Depends on: 7.2
  - **Goal:** Student edits profile fields, manages skills, uploads/downloads resumes — all persisted.
  - **How to build:**
    - [x] 1. Profile form → `PATCH /api/v1/students/me` with `GlassInput` fields and Zod-mirrored client validation; save via `ClayButton`.
    - [x] 2. Skills manager: add (searchable taxonomy select) / remove via `students/me/skills` routes; chips with confidence display.
    - [x] 3. Resume upload → `POST /api/v1/students/me/resumes` (file input, client-side type/size pre-check matching server rules); list versions with state badge; download via the download route.
    - [x] 4. Profile-completeness indicator updates after save (refetch).
  - **Test before proceeding:**
    - Manual: edit CGPA → persists across reload; add+remove a skill → reflected in DB; upload the sample PDF → appears in version list and downloads intact (checksum/size match).
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 7.8 — Student e2e happy path**
  - Depends on: 7.2–7.7
  - **Goal:** One Playwright spec proves the core student journey end-to-end.
  - **How to build:**
    - [x] 1. `e2e/student-flow.spec.ts`: login as seeded student → dashboard renders → open jobs list → open a job detail → apply (use a seeded job the student hasn't applied to; reset via seed idempotency) → assert application row appears in `/student/applications`.
    - [x] 2. Make the spec re-runnable: withdraw/cleanup step or DB reset hook.
    - [x] 3. Wire into `npm run e2e`.
  - **Test before proceeding:**
    - `npm run e2e` green twice consecutively (proves re-runnability).
  - [x] **Definition of Done** — implemented AND tests above pass

---

## Phase 8 — Placement Admin Portal

All 9 pages under `app/(placement)/placement/`. Same pattern as Phase 7; login `placement@college.edu` / `admin123`.

- [x] **Task 8.1 — Admin dashboard (`placement/page.tsx`)**
  - Depends on: 7.8
  - **Goal:** Dashboard surfaces live placement KPIs and items needing review.
  - **How to build:**
    - [x] 1. Wire to `GET /api/v1/analytics/placement-stats`; stat tiles via `StatCard`.
    - [x] 2. "Needs review" list: evaluations with `requiresReview` (from `GET /api/v1/evaluations?requiresReview=true` or client filter) linking to candidate detail.
    - [x] 3. Loading/empty/error states; role guard: a STUDENT session visiting `/placement` is redirected.
  - **Test before proceeding:**
    - Manual: KPI numbers match DB aggregates; student account visiting `/placement` → redirected. Playwright: admin login → dashboard renders KPIs.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 8.2 — Students roster (`placement/students`)**
  - Depends on: 8.1
  - **Goal:** Admin browses/searches the full roster with placement-readiness signals.
  - **How to build:**
    - [x] 1. Wire to `GET /api/v1/students` with the pagination/filter params from Task 3.3.
    - [x] 2. Table: name, roll number, department, CGPA, backlogs, profile completeness; search + department filter controls.
    - [x] 3. Row click → student detail (`students/[id]`) view or drawer with skills + resume state.
  - **Test before proceeding:**
    - Manual: all 5 seeded students listed; search narrows correctly; detail shows real skills.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 8.3 — Candidates + candidate detail (`placement/candidates`, `candidates/[id]`)**
  - Depends on: 8.2
  - **Goal:** Admin reviews ranked candidates per job with full evaluation explainability and can override.
  - **How to build:**
    - [x] 1. Candidates list: job selector → `GET /api/v1/jobs/[jobId]/applications` (live match scores) → `CandidateCard` list sorted by score.
    - [x] 2. Detail `[id]`: full evaluation via `GET /api/v1/evaluations/[evaluationId]` — requirement matches with explanations, eligibility rule results, `HumanReviewBanner` when flagged.
    - [x] 3. Override action: `GlassDialog` with decision select + required reason → `POST /api/v1/evaluations/[evaluationId]/override`; on success show override history (append-only list).
    - [x] 4. Shortlist transition button → applications PATCH (Task 3.5 rules).
  - **Test before proceeding:**
    - Manual: override with empty reason blocked client+server; successful override appears in history and `audit-log`. Playwright: candidate detail renders score + explanation text.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 8.4 — Applications management (`placement/applications`)**
  - Depends on: 8.3
  - **Goal:** Admin sees all applications and performs legal status transitions.
  - **How to build:**
    - [x] 1. Wire to `GET /api/v1/applications` with status/job filters.
    - [x] 2. Status transition control offering only legal next states (mirror the Task 3.5 transition map in a shared constant in `types/` so client and service agree).
    - [x] 3. Illegal-transition 409 surfaced as a toast, UI state rolled back.
  - **Test before proceeding:**
    - Manual: APPLIED → UNDER_REVIEW → SHORTLISTED chain works; UI never offers an illegal jump; DB and UI agree after each step.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 8.5 — Jobs management (`placement/jobs`)**
  - Depends on: 8.1
  - **Goal:** Admin creates, edits, publishes, and closes jobs with eligibility constraints.
  - **How to build:**
    - [x] 1. List with status badges (DRAFT/PUBLISHED/CLOSED) + application/shortlist counts.
    - [x] 2. Create/edit form in `GlassDialog`: version fields + eligibility (minCgpa, maxBacklogs, departments, programs) + requirements builder (skill select from taxonomy, weight, required toggle as clay toggle) → `POST /api/v1/jobs` / `PATCH jobs/[jobId]`.
    - [x] 3. Publish/close actions → the dedicated routes; confirm dialogs; counts refresh after transitions.
  - **Test before proceeding:**
    - Manual: create draft → publish → visible in student portal (`/student/jobs`) → close → gone from student list. Form validation blocks past deadlines and CGPA >10.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 8.6 — Analytics + reports (`placement/analytics`, `placement/reports`)**
  - Depends on: 8.1
  - **Goal:** Charts and the report catalog render real aggregate data.
  - **How to build:**
    - [x] 1. Analytics: wire `placement-stats` + `skill-gaps` endpoints into Recharts (status funnel, top missing skills bar chart); chart colors from tokens, legible both themes.
    - [x] 2. Reports: `GET /api/v1/reports` paginated catalog table.
    - [x] 3. Empty-data rendering (no NaN/blank charts on a thin DB).
  - **Test before proceeding:**
    - Manual: chart figures match Task 3.8's verified numbers; pagination works; both themes legible.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 8.7 — Compare view (`placement/compare`)**
  - Depends on: 8.3
  - **Goal:** Side-by-side comparison of 2+ candidates for one job.
  - **How to build:**
    - [x] 1. Candidate multi-select (from the job's applications) → side-by-side columns using `ResumeComparison`/score components.
    - [x] 2. Rows: overall score, coverage, per-requirement match state, eligibility status.
    - [x] 3. Highlight per-row best value accessibly (icon/weight, not color alone).
  - **Test before proceeding:**
    - Manual: comparing two seeded candidates shows differing values matching their evaluation rows.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 8.8 — Admin e2e path**
  - Depends on: 8.1–8.7
  - **Goal:** One Playwright spec proves the core admin journey.
  - **How to build:**
    - [x] 1. `e2e/admin-flow.spec.ts`: login as admin → create+publish a job → student-side apply step (reuse 7.8 helper) or use a seeded application → open candidates → open evaluation detail → submit an override with reason → assert override appears in history.
    - [x] 2. Re-runnable: unique job title per run (timestamp) + cleanup or idempotent seed reset.
    - [x] 3. Wire into `npm run e2e`.
  - **Test before proceeding:**
    - `npm run e2e` (both flow specs) green twice consecutively.
  - [x] **Definition of Done** — implemented AND tests above pass

---

## Phase 9 — Cross-cutting QA & Hardening

- [x] **Task 9.1 — Auth edge-case regression pass**
  - Depends on: 8.8
  - **Goal:** Auth holds under expiry, tampering, and role-crossing at both API and UI level.
  - **How to build:**
    - [x] 1. Re-run `npm run test:security` (Phase 1 suite) — must still be green after all feature work.
    - [x] 2. Add: expired access token mid-session → client refresh flow recovers (Playwright with short-lived token or clock manipulation); tampered token in localStorage → clean logout, no crash.
    - [x] 3. Role-crossing UI checks: student URL-navigates to every `/placement/*` route → redirected; admin to `/student/*` per intended behavior.
    - [x] 4. Verify forged-header exploit (1.1) once more via curl against dev server → 401.
  - **Test before proceeding:**
    - All security + new edge tests green; manual curl exploit re-check documented in the commit message.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 9.2 — Engine coverage target ≥80%**
  - Depends on: 4.3
  - **Goal:** `lib/engines/` holds ≥80% line & branch coverage, enforced by config.
  - **How to build:**
    - [x] 1. `npx jest --coverage --collectCoverageFrom="lib/engines/**"` — record baseline.
    - [x] 2. Fill gaps surfaced by the report (typically summary-builder branches and category keywords).
    - [x] 3. Add `coverageThreshold: { 'lib/engines/**': { lines: 80, branches: 80 } }` to `jest.config.ts` so regressions fail CI/`npm test`.
  - **Test before proceeding:**
    - `npm test` passes with thresholds active.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 9.3 — Full Playwright suite**
  - Depends on: 9.1
  - **Goal:** E2e coverage spans both portals beyond the two happy paths.
  - **How to build:**
    - [x] 1. Add specs: theme switch persists across reload; withdraw flow; job filter; admin status transition; 404/error page rendering.
    - [x] 2. Stabilize: no arbitrary sleeps — use locator waits; run suite 3× to shake flakes.
    - [x] 3. Document the one-command run (`npm run e2e`, requires seeded DB) in `README.md`.
  - **Test before proceeding:**
    - Full suite green 3 consecutive runs.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 9.4 — Accessibility pass**
  - Depends on: 9.3
  - **Goal:** Keyboard and contrast are verified on every page, on both glass and clay surfaces, both themes.
  - **How to build:**
    - [x] 1. Keyboard-only walkthrough of both portals: every interactive element reachable, visible focus, dialogs trap focus and close on Escape (`GlassDialog`).
    - [x] 2. Contrast audit (devtools/axe) with attention to text over glass (translucency!) and on clay in dark theme; fix token values where <4.5:1.
    - [x] 3. Form labels + error announcements on profile and job forms; charts have text alternatives (data table or aria summary).
    - [x] 4. Record results as a checklist in `docs/frontend/design-system.md#qa`.
  - **Test before proceeding:**
    - axe scan on landing, 2 student pages, 2 admin pages → zero critical/serious violations; keyboard walkthrough checklist ticked.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 9.5 — PWA / service-worker smoke**
  - Depends on: 9.3
  - **Goal:** Install prompt, offline shell, and update flow work; SW never caches API responses stale.
  - **How to build:**
    - [x] 1. Review `public/sw.js` cache strategy: app-shell assets cached, `/api/*` network-only (fix if it caches API).
    - [x] 2. Production build → install PWA from Chrome; verify `app/manifest.ts` icons/name.
    - [x] 3. Offline test: kill network → shell renders with a sensible offline state, no white screen.
    - [x] 4. Update flow: bump SW cache version → old clients pick up the new version on reload (`RegisterSW` behavior).
  - **Test before proceeding:**
    - Manual checklist above passes on a production build; Lighthouse PWA installability check passes.
  - [x] **Definition of Done** — implemented AND tests above pass

---

## Phase 10 — Deployment Readiness

- [x] **Task 10.1 — Environment variable audit**
  - Depends on: 9.1
  - **Goal:** Every required env var is documented, validated at boot, and has no fallback anywhere.
  - **How to build:**
    - [x] 1. `grep -rn "process.env" --include="*.ts" --include="*.tsx" app lib services middleware.ts` — build the full inventory.
    - [x] 2. Assert zero `||`/`??` fallbacks on secrets (JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL); non-secret vars may default only with a comment.
    - [x] 3. `.env.example` lists every variable with a comment; matches the inventory exactly.
    - [x] 4. Boot test: unset each required var one at a time → app fails fast with a clear message (spot-check the two JWT vars + DATABASE_URL).
  - **Test before proceeding:**
    - Inventory grep output attached to commit; the three unset-var boot tests fail fast as expected; normal boot works.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 10.2 — Production build & runtime check**
  - Depends on: 10.1
  - **Goal:** `next build` + `next start` serve the full app correctly.
  - **How to build:**
    - [x] 1. Remove/gate dev-only artifacts: `app/dev/design` preview route excluded from production (env-gated 404 or deletion).
    - [x] 2. `npm run build` — zero errors; review warnings.
    - [x] 3. `npm run start` against the dev DB: login both roles, one student page, one admin page, one API mutation.
    - [x] 4. Check bundle output for accidental server-secret leakage into client chunks (`grep` build output for JWT_SECRET — must be absent).
  - **Test before proceeding:**
    - Production smoke checklist passes; secret grep of `.next/static` → zero hits.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 10.3 — Error handling & logging review**
  - Depends on: 10.2
  - **Goal:** Failures are observable without leaking internals to clients.
  - **How to build:**
    - [x] 1. Sweep API handlers: every catch logs with route-tagged prefix (pattern exists: `[JOBS_POST_ERROR]`) and returns the standard `lib/api/response.ts` error shape — never a raw stack to the client.
    - [x] 2. Add `app/error.tsx` and `app/not-found.tsx` (styled per design system) if missing.
    - [x] 3. Verify Zod errors return field-level detail (400) while unexpected errors return generic 500.
    - [x] 4. Confirm audit events cover: login fail, status transitions, overrides, job publish/close.
  - **Test before proceeding:**
    - Force one 400 (bad Zod body), one 404, one simulated 500 → correct client shapes, no stack traces; server log carries the tagged detail.
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 10.4 — Final security re-verification**
  - Depends on: 10.2
  - **Goal:** Phase 1's fixes are provably live in the production build.
  - **How to build:**
    - [x] 1. Against `npm run start`: replay the forged-header exploit (`POST /api/v1/jobs` + `x-user-role: PLACEMENT_ADMIN`, no token) → 401.
    - [x] 2. Replay rate-limit test on `POST /api/v1/auth` → 429 after threshold.
    - [x] 3. `npm run test:security` one final time on the release commit.
    - [x] 4. Confirm the Firebase key is absent from the repo and from git history of the release branch (`git log --all --diff-filter=A -- "*adminsdk*"` → nothing after the migration commit).
  - **Test before proceeding:**
    - All four checks pass; results recorded in the runbook (10.5).
  - [x] **Definition of Done** — implemented AND tests above pass

- [x] **Task 10.5 — Deployment runbook**
  - Depends on: 10.3, 10.4
  - **Goal:** A new operator can deploy from zero using one document.
  - **How to build:**
    - [x] 1. Create `docs/14-devops-and-deployment/runbook.md`: prerequisites (Node ≥18, PostgreSQL 16), env-var table (from 10.1), steps: provision DB → `prisma migrate deploy` → seed (optional) → `npm run build` → `npm run start`.
    - [x] 2. Include `docker-compose.yml` path for the DB and the local portable-Postgres alternative from `README.md`.
    - [x] 3. Rollback section: previous-commit redeploy + `prisma migrate` caveats.
    - [x] 4. Health-check/smoke list (the 10.2 checklist) and the security re-verification steps (10.4).
    - [x] 5. Link from `README.md`.
  - **Test before proceeding:**
    - Dry-run the runbook top-to-bottom on a fresh clone + fresh DB; every step works as written.
  - [x] **Definition of Done** — implemented AND tests above pass. **Project ships.**
