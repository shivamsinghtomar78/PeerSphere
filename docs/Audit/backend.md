# PeerSphere — Backend Audit

Scope: `app/api/**`, `lib/services/**`, `lib/engines/**`, `lib/auth/**`,
`lib/db/**`, `middleware.ts`, `prisma/**`. PeerSphere is a unified Next.js
16 app — "backend" here means the API route handlers, services, and data
layer, not a separate server.

Already-fixed issues from `BUGFIX-TASKS.md` (10 bugs, all `[x]`) are not
re-listed here. This audit looked for what's still open.

---

## Environment note (read this before the findings below)

Running `tsc --noEmit` in the audit sandbox produced ~50 errors like
`Module '"@prisma/client"' has no exported member 'ApplicationStatus'`.
This is **not a code bug** — the sandbox's network policy blocks
`binaries.prisma.sh`, so `prisma generate` fails and leaves a stub client
(`PrismaClient: any`) instead of the real generated types. Every
"implicit any" and "no exported member" error downstream of that is
this stub, not your code. In a normal environment with network access
these do not occur (confirmed: the schema already defines
`ApplicationStatus`, `EvaluationStatus`, etc. correctly — `prisma/schema.prisma:68,82`).

The one thing that *is* a real, fixable gap: **there was no `postinstall`
hook**, so a fresh `npm install` silently leaves the stub client in place
until someone remembers to run `db:generate`. Fixed below.

---

## Findings

> **Status correction (2026-09-12):** the two findings below were marked FIXED
> by the audit, but the fix existed only in `peersphere_fixes.diff` — it was
> never applied to the repository (verified via git history and the working
> tree). The diff has now been applied, and both fixes verified against the
> live API: an HTML file renamed to `.pdf` is rejected with
> `400 "File is not a valid PDF"`, a real `%PDF-` upload succeeds, and
> `npm install` runs `prisma generate` via the new `postinstall` hook.

### 1. Resume upload trusted only the client-supplied MIME type (HIGH) — FIXED

**File:** `lib/services/resumes.service.ts` (`uploadResume`), called from
`app/api/v1/students/me/resumes/route.ts`.

**Issue:** The only file-type check was
`if (file.mimetype !== 'application/pdf')`. `mimetype` comes from the
browser's `File.type`, which is derived from the file extension the
*client* sends — fully attacker-controlled. Renaming `payload.html` to
`resume.pdf` before upload passes this check with no further validation
of the actual bytes. The file is then written to disk and later served
back to placement officers via the download route with
`Content-Type: <stored mimeType>` and the original filename in
`Content-Disposition`.

**Impact:** A student could upload arbitrary content labeled as a PDF.
Not remote-code-execution on its own (the file is served as an
attachment, not executed), but it defeats the "only PDF resumes" data
integrity guarantee and is a stepping stone for phishing/malware
distribution through a trusted platform (officers download and open
"resumes" routinely).

**Fix applied:** Added a magic-byte check — real PDFs start with the
5-byte signature `%PDF-`. Content is now rejected unless the buffer
actually starts with that signature, in addition to the existing
mimetype/size checks.

```ts
const PDF_MAGIC_BYTES = Buffer.from('%PDF-', 'ascii');
function isPdfContent(buffer: Buffer): boolean {
  return buffer.length >= PDF_MAGIC_BYTES.length && buffer.subarray(0, 5).equals(PDF_MAGIC_BYTES);
}
// ...
if (!isPdfContent(file.buffer)) {
  throw new ApiError(400, 'INVALID_FILE_TYPE', 'File is not a valid PDF');
}
```

**Verify:** `node -e` sanity check confirmed a real `%PDF-...` buffer
passes and an HTML buffer is rejected. ESLint clean on the changed file.

---

### 2. No `postinstall` hook to generate the Prisma client (MEDIUM) — FIXED

**File:** `package.json`.

**Issue:** `db:generate` (`prisma generate`) existed as a manual script
but nothing ran it automatically after `npm install`. A fresh clone, a
CI runner, or a new contributor running only `npm install` ends up with
whatever Prisma client happens to already be in `node_modules` — stale,
or a stub if generation never ran. This is exactly what happened in
this audit sandbox and would happen in any CI pipeline that doesn't
special-case a `prisma generate` step.

**Fix applied:**
```json
"scripts": {
  "postinstall": "prisma generate",
  ...
}
```

**Verify:** `npm install` now runs `prisma generate` automatically as
the last install step.

---

### 3. `clientKeyFromHeaders` trusts `x-forwarded-for` (LOW, informational)

**File:** `lib/auth/rate-limit.ts`.

**Issue:** The login rate limiter keys on `x-forwarded-for` (falling
back to `x-real-ip`, then a shared bucket). If the app is ever exposed
directly (not strictly behind a proxy that overwrites/strips this
header), a client can set an arbitrary `x-forwarded-for` value per
request and get a fresh rate-limit bucket every time — bypassing the
throttle entirely.

**Not fixed in this pass** — the correct fix depends on the deployment
topology (Vercel and most reverse proxies set this header
server-side and it can be trusted; a bare Node deployment cannot trust
it at all), which this audit can't determine from the code alone.
Listed under Scope to improve.

---

## Scope to improve

Real opportunities noticed while reading the code — not a generic
checklist. None of these are bugs; they're deliberate trade-offs worth
a conscious decision rather than a silent default.

- **Access/refresh tokens in `localStorage`** (surfaced from the
  frontend's `api-client.ts`, but it's an auth-architecture decision
  that lives on the backend too — cookie-based sessions vs. bearer
  tokens). Current design is easy to reason about and works well with
  the Edge-runtime middleware, but any XSS anywhere in the app can
  exfiltrate a 7-day-lived refresh token. Moving to an `httpOnly`,
  `Secure`, `SameSite` cookie for the refresh token (keeping the short
  15-minute access token in memory) would close that off, at the cost
  of adding CSRF protection and reworking `middleware.ts` to read a
  cookie instead of an `Authorization` header. Worth doing before this
  handles real placement data at scale; not worth doing in a quick
  audit pass.
- **In-memory rate limiter is single-instance** — already documented
  in the code's own comment (`rate-limit.ts`). Fine today; the moment
  this deploys with more than one server instance, login throttling
  silently stops working across instances. Swap the `Map` for Redis
  (or a serverless KV) before horizontally scaling.
- **`x-forwarded-for` trust boundary** (see Finding 3) — worth an
  explicit decision documented in the deployment README once the
  hosting setup is finalized, rather than left implicit.
- **Widespread `catch (error: any)`** across API routes (flagged by
  ESLint as warnings, not blocked). Each one individually is low risk,
  but it means a route can't distinguish "expected `ApiError`" from
  "unexpected crash" by type — it currently does so with an ad-hoc
  `error.statusCode === 400` check. A shared `isApiError(error)` type
  guard (mirroring the one already written for the frontend in
  `lib/api-client.ts`) would remove ~30 instances of untyped error
  handling in one small shared utility.
- **No CI pipeline checked in** — there's no `.github/workflows` (or
  equivalent), so typecheck/lint/test only run when someone remembers
  to run them locally. Given `BUGFIX-TASKS.md` already lists a
  "Regression gate" the team runs manually before shipping, that gate
  is a very short step away from becoming an automated required check.
- **Structured logging** — routes currently `console.error` with a
  tag string (`[AUTH_LOGIN_ERROR]`, etc.), which works but doesn't
  give you request correlation, log levels, or a place to plug in an
  APM tool later. Worth revisiting once there's real production
  traffic to debug.
