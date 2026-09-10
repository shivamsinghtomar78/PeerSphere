# Bug-Fix Tasks — Browser Testing Findings (2026-09-10)

Source: full Playwright walkthrough of both portals against the live dev server
(fresh student + officer logins, apply flow, resume upload, override flow, theme toggle).
Each task lists severity, reproduction, root cause, the fix, and how it was verified.

Status legend: `[ ]` open · `[x]` fixed & verified

---

## [x] Bug 1 — Student Match Analysis renders an empty skill decomposition (HIGH)

**Repro:** Sign in as `arjun.sharma@college.edu` → Match Analysis → select
"Software Development Engineer — InnovateTech Solutions" (75% evaluation).
The narrative says "4 strong and 0 partial match(es) … 2 missing required skill(s)",
but *Skill Alignment Summary* shows Strong 0 / Partial 0 / Missing 0 and all three
categorization columns are empty. The API response contains 6 fully populated
`requirementMatches` (matchState, contribution, explanation).

**Root cause:** `app/(student)/student/match/page.tsx:74-91` builds the
`MatchResult` inline with hardcoded `strongSkills: []`, `partialSkills: []`,
`missingSkills: []` — `evaluation.requirementMatches` is never mapped.

**Fix:** Use the existing mapper `mapBackendEvaluationToMatchResult`
(`types/api.ts`) — the same one the admin deep-dive imports — instead of the
hand-rolled object.

**Verify:** Match Analysis for the SDE job shows populated Strong/Partial/Missing
chips whose counts equal the narrative, and the Resume-vs-Requirements matrix
shows real per-skill statuses.

---

## [x] Bug 2 — Candidate Deep-Dive shows no score decomposition or rule results (HIGH)

**Repro:** Officer → Candidates → select SDE drive → Inspect Arjun Sharma.
"Skill Matching Categorization" renders `Strong Matches (0)` etc. (all empty)
and there is no eligibility-rule checklist, although the evaluation has full
`requirementMatches`.

**Root cause:** The page maps `application.latestEvaluation`
(`app/(placement)/placement/candidates/[id]/page.tsx:84-88`), but the
applications list service builds `latestEvaluation` from a narrow Prisma
`select` that omits `requirementMatches`
(`lib/services/applications.service.ts:420-432`) — so the mapper receives
nothing to split.

**Fix:** After the application/job is known, fetch the full evaluation through
`fetchEvaluationsByJobId(jobId)` (the same source the ranking matrix uses) and
map that. Added an **Eligibility Rules card** (min CGPA vs student CGPA,
backlogs, department, program — each Met / Not met) built from
`job.eligibility` + student record.

**Verify:** Deep-dive from the SDE ranking shows the populated categorization,
the comparison matrix, and a 4-row rule checklist.

---

## [x] Bug 3 — `?jobId=` deep links ignored in three places (HIGH)

**Repro:**
1. Job detail → "Detailed Match Breakdown" navigates to
   `/student/match?jobId=<data-analyst>` but the page selects the FIRST job
   (Cloud Infrastructure Engineer).
2. `/placement/candidates?jobId=<sde>` — Drive select stays on the first job.
3. Ranking → Inspect navigates to `/placement/candidates/{studentId}` with no
   job context; the deep-dive picked "newest application with an evaluation"
   (showed Full Stack 13% after inspecting the SDE 75% row).

**Root cause:** Both list pages hardcode `setSelected…(items[0])` on mount
(`match/page.tsx:52-54`, `candidates/page.tsx:42-44`); the Inspect/name links
(`candidates/page.tsx:276,326`) drop the drive id; the deep-dive has no way to
receive it (`[id]/page.tsx:74-75`).

**Fix:** Both pages read `jobId` from `window.location.search` on mount and
select it when it matches a loaded job. Candidate links now carry
`?jobId=${selectedJobId}`, and the deep-dive prefers the application for that
job.

**Verify:** All three navigations land on the correct drive.

---

## [x] Bug 4 — Resume download links return 401 (HIGH)

**Repro:** Student → Profile → click "Download" on a resume version (or the
Active Resume "Download resume" link) → JSON 401 response instead of the PDF.

**Root cause:** Plain `<a href>` to
`/api/v1/students/me/resumes/{id}/download`; the route authenticates via
`Authorization: Bearer` header only
(`app/api/v1/students/me/resumes/[id]/download/route.ts:21`), which an anchor
cannot send.

**Fix:** New `downloadMyResume(id, filename)` in `services/student-api.ts` —
`apiClient` blob request → object URL → programmatic download (same pattern as
the candidates CSV export). Both links replaced with buttons that call it.

**Verify:** Both download buttons deliver the PDF while signed in.

---

## [x] Bug 5 — Unevaluated student×job pairs display "0% · Low Match · Very Low (0%)" (HIGH)

**Repro:** Job detail for "Data Analyst Intern" (no evaluation) shows a 0% ring
with "Low Match / Confidence: Very Low (0%)". Admin dashboard Top Candidates,
the ranking matrix, and Compare do the same — Compare even marks Python
"✕ missing" for a student whose profile contains Python.

**Root cause:** Synthetic zero `MatchResult` objects are rendered as if they
were real: `app/(student)/student/jobs/[id]/page.tsx:75-89` and
`services/placement-api.ts:416-432` (`fetchCandidatesForJob`, consumed by
ranking, compare, and the admin dashboard).

**Fix:** `fetchCandidatesForJob` now returns `hasEvaluation` per candidate
(type extended in `types/index.ts`); ranking/compare/dashboard render a muted
"Not evaluated" state instead of fake scores and fake missing-skill chips. The
student job detail additionally looks up the student's real evaluation for the
job (`fetchMyEvaluations` + `mapBackendEvaluationToMatchResult`) and shows a
"Not evaluated yet" placeholder when none exists.

**Verify:** Every place that showed 0% for the unevaluated pairs now reads
"Not evaluated"; evaluated pairs unchanged.

---

## [x] Bug 6 — Expired session loops 401s and shows raw error states (MEDIUM)

**Repro:** With a stale `peersphere_access_token`/`peersphere_refresh_token` in
localStorage, open `/student` → pages render "Error: Internal server error" /
retry loops; the console fills with 401s. No redirect to sign-in.

**Root cause:** `lib/api-client.ts` clears storage when refresh fails
(lines 88-95, 117-123) but never navigates; every portal page then renders its
error state with no session.

**Fix:** After `clearAuth()` in both failure paths, redirect to `/auth`
(guarded: not for `/auth/*` requests, not when already on `/auth` or `/`).

**Verify:** Corrupting both tokens and loading `/student` bounces to `/auth`.

---

## [x] Bug 7 — Skill duplication: "Docker" listed twice; React duplicate-key errors (MEDIUM)

**Repro:** Admin dashboard "Campus Skill Gaps" and the analytics deficit chart
show Docker twice (3 students 60% + 2 students 40%). Student Skill Gaps page
logs `Encountered two children with the same key` for `docker`, `spring-boot`,
`data-structures-&-algorithms`.

**Root cause:** Admin: `getSkillGaps` groups `RequirementMatch` rows by
**requirementId** (`lib/services/analytics.service.ts:96-103`) — the same skill
required by two jobs yields two rows. Student:
`extractSkillGapsFromEvaluations` (`services/student-api.ts:340-357`) pushes
recommendations from every evaluation without dedup, and keys are name-slugs.

**Fix:** Admin service merges rows by resolved skill id (summing counts) before
sorting/capping. Student extractor dedups by lowercased skill name, keeping the
higher `potentialLift` / priority.

**Verify:** Docker appears once in both admin views; Skill Gaps page logs no
duplicate-key errors.

---

## [x] Bug 8 — Applications accepted after the deadline (MEDIUM)

**Repro:** POST `/api/v1/jobs/{id}/apply` for "Data Analyst Intern"
(deadline 25 Aug 2026) succeeded on 10 Sep 2026.

**Root cause:** `applyToJob` (`lib/services/applications.service.ts:125-166`)
validates PUBLISHED status and eligibility but never checks
`jobVersion.deadline`.

**Fix:** Reject with `422 UNPROCESSABLE — "The application deadline for this
job has passed"` when `jobVersion.deadline < now` (checked before the
duplicate-application short-circuit so re-applies after the deadline are also
refused).

**Verify:** API apply to the expired drive returns 422 with that message;
applying to a future-deadline drive still works.

---

## [x] Bug 9 — Cosmetic / content batch (LOW)

1. **Rank "#0"** — `fetchCandidatesForJob` hardcoded `rank: 0`
   (`services/placement-api.ts:438`). Now ranks evaluated candidates 1..n by
   score; unevaluated rows show "—".
2. **Priority legend vs all-purple bars** — `getSkillPriority` used absolute
   thresholds (>50 students) meaningless for small cohorts
   (`analytics.service.ts:23-27`). Now percentage-based
   (≥50% high, ≥25% medium).
3. **Clipped department labels** ("mation nology") — widened the `YAxis` of the
   horizontal department chart (`app/(placement)/placement/analytics/page.tsx`).
4. **"Recommended action" duplicated "Why it matters"** —
   `recommendation: rec.reason` (`services/student-api.ts:352`). Now uses the
   first improvement step ("Start here: …") with an evidence-based fallback.
5. **"0 KB" upload size** — `formatFileSize` in the profile page rounded
   sub-kilobyte files to 0; now clamps to a 1 KB minimum.

**Verify:** Ranking shows #1; deficit bars carry priority colors matching the
legend; department labels fully visible; skill-gap cards show a distinct
action line; version history shows "1 KB" for the tiny test PDF.

---

## [x] Bonus — Candidates page double-fetched and timed out on a cold database (found while verifying)

**Repro:** `/placement/candidates` intermittently showed "Failed to load
candidates — timeout of 10000ms exceeded" when the serverless Postgres was cold.

**Root cause:** The mount effect fetched candidates AND `setSelectedJobId`
triggered the `[selectedJobId]` effect to fetch them again (doubled once more
by dev StrictMode) — 4-6 stacked heavy requests against ~250ms-per-query cold
Neon exceeded the axios 10s ceiling.

**Fix:** The mount effect now only resolves jobs + the selected drive; the
`[selectedJobId]` effect is the single candidates fetch (and manages the
loading state). The apiClient timeout was raised 10s → 30s
(`lib/api-client.ts`) — timing out a legitimate slow query only multiplies
load.

**Verify:** Repeated loads of the ranking page succeed; network log shows one
applications + one evaluations request per drive selection.

---

## [x] Bug 10 — Reports page: "Download PDF" and "View Summary" did nothing (reported 2026-09-11)

**Repro:** `/placement/reports` → click "Download PDF" or "View Summary" on any
report card → nothing happens.

**Root cause:** Both buttons had **no onClick handlers at all**
(`app/(placement)/placement/reports/page.tsx:93-98`), and no report-content
endpoint existed — `GET /api/v1/reports` returns catalog metadata only
(`AVAILABLE_REPORTS` in `lib/services/analytics.service.ts`).

**Fix:**
- **Backend:** `generateReport(reportId)` in `lib/services/analytics.service.ts`
  builds each of the six reports live from the database (placement funnel,
  distinct-student skill gaps, department breakdown, per-company pipeline,
  readiness distribution, evaluation/override audit trail), exposed at
  `GET /api/v1/reports/[id]` (PLACEMENT_ADMIN only).
- **Frontend:** "View Summary" opens a glass dialog rendering the generated
  sections (with a per-button "Generating…" state); "Download CSV" (renamed
  from "Download PDF" — no PDF engine exists, so the label is now honest)
  builds a UTF-8 CSV from the same data via an authenticated blob download.
  Card copy no longer claims a canned "file size / PDF bundle".

**Verify:** Summary dialog shows live figures (5 students, 6 active jobs,
avg match 62.14%); `placement-summary-…csv` and `skill-gap-analysis-…csv`
download with correct rows — the skill-gap CSV also confirms the Bug 7 dedup
(Docker listed once, distinct-student counts, cohort-relative priorities).

---

## Regression gate

- `npm run build` ✓
- Playwright MCP re-walk of every repro above ✓
- E2E suites: `smoke`, `accessibility` (axe), `student-flow`, `admin-flow`,
  `admin-pages` ✓
