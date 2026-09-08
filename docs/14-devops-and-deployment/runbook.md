# PeerSphere Deployment Runbook

Verified against the production build on 2026-09-08.

## Prerequisites

- Node.js ≥ 18 (developed on 24.x)
- A PostgreSQL 16 database — the project uses [Neon](https://neon.tech) (any Postgres 16 works)
- The repository at the release commit, clean tree

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon: **pooled** string (hostname contains `-pooler`), keep `?sslmode=require` |
| `JWT_SECRET` | ✅ | min 32 chars — `openssl rand -hex 32`; the app **refuses to boot** without it |
| `JWT_REFRESH_SECRET` | ✅ | different value, same rules |
| `JWT_EXPIRES_IN` | – | default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | – | default `7d` |
| `NEXT_PUBLIC_API_URL` | – | default `/api/v1` — leave unset |
| `UPLOAD_DIR` / `MAX_FILE_SIZE_MB` | – | resume storage dir (default `./uploads`) / cap (default 5) |

No variable has a secret fallback; audited 2026-09-08 (`grep -rn "process.env" app lib services middleware.ts`).

## Deploy steps

```powershell
npm ci
npx prisma generate
npx prisma migrate deploy      # applies prisma/migrations/ to a fresh or existing DB
npm run db:seed                # OPTIONAL demo dataset (idempotent)
npm run build
npm run start                  # or: next start -p <port>
```

Schema changes during development: `npx prisma db push`, then regenerate the
migration diff into `prisma/migrations/` (Neon's pooled connection cannot host
`prisma migrate dev`'s shadow database — see README Quick Start).

## Post-deploy smoke checklist (all verified on the release build)

| Check | Expected |
|---|---|
| `GET /` | 200, hero renders |
| `POST /api/v1/auth` with a seeded login | 200 + tokens |
| Authenticated `GET /api/v1/students/me` | 200 |
| **Security:** `POST /api/v1/jobs` with forged `x-user-role: PLACEMENT_ADMIN`, no token | **401** |
| **Security:** 11 rapid failed logins from one client | **429** by the 11th |
| `GET /dev/design` | 404 in production |
| Client bundles (`.next/static`) | zero `JWT_SECRET` matches |
| Lighthouse on `/` (prod) | Perf ≥90 / A11y ≥95 (measured 95/98, CLS 0) |

## Test suites (run before tagging a release)

```powershell
npm test               # 134 unit/integration tests (needs .env.test → local test DB)
npm run test:security  # auth/middleware suite incl. the forged-header regression
npm run e2e            # 20 Playwright specs (boots dev server on :3100, seeded DB)
```

## Rollback

1. Redeploy the previous commit (`git checkout <prev-tag> && npm ci && npm run build && npm run start`).
2. Migrations are additive so far (baseline `0_init` + index-only changes) — no
   down-migrations required. If a future migration must be reverted, restore the
   Neon branch/backup from before the deploy (Neon: Restore → point-in-time).
3. Re-run the smoke checklist above.

## Operational notes

- **Neon autosuspend:** first request after idle takes 1–3 s while compute wakes.
- **Rate limiter** is in-memory (per instance). Multi-instance deploys should move
  `lib/auth/rate-limit.ts` to Redis — the interface is drop-in.
- **Uploads** are stored on local disk (`UPLOAD_DIR`); use a persistent volume, or
  swap `lib/services/resumes.service.ts` storage for object storage in multi-node setups.
- Audit trail: failed logins, application status changes, overrides, and job
  publish/close all write `audit_events` rows (admin-visible at `/api/v1/audit-log`).
