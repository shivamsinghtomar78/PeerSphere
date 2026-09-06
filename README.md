# PeerSphere — AI-Based Placement Matching & Skill Gap Analysis

Institutional placement platform built as a **unified Next.js 16 app** (App Router + API Routes + Prisma + PostgreSQL). It provides deterministic eligibility screening, semantic skill matching, explainable confidence metrics, and actionable skill-gap learning roadmaps for students and placement officers.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Database:** PostgreSQL 16 with Prisma ORM
- **API:** Same-origin route handlers (`app/api/v1/*`) with JWT auth (Web Crypto, Edge-safe)
- **Matching engines:** Deterministic rule-based skill matching, eligibility, and skill-gap analysis (`lib/engines/`)
- **UI:** Tailwind CSS + design tokens (`styles/tokens.css`, `styles/glass.css`), glassmorphism system
- **PWA:** Installable with offline app shell (`public/sw.js`, `app/manifest.ts`)
- **Linting:** ESLint flat config (`eslint.config.mjs`)

## Quick Start

### 1. Start the database (local portable PostgreSQL 16)

```powershell
schtasks.exe /run /tn "PeerSpherePostgres"     # starts .pgsql\start-pg.cmd (port 5432)
```

If the scheduled task does not exist, run once:
```powershell
& ".\pgsql\start-pg.cmd"   # keep this window open
```

### 2. Configure & seed

```powershell
Copy-Item .env.example .env     # or use the existing .env
npm install
npx prisma generate
npx prisma db push              # schema sync
npm run db:seed                 # idempotent seed via tsx
```

### 3. Run

```powershell
npm run dev                     # http://localhost:3000
npm run lint                    # 0 errors expected
npx tsc --noEmit                # 0 errors expected
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Student | `arjun.sharma@college.edu` | `student123` |
| Placement Admin | `placement@college.edu` | `admin123` |

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:seed` | Reset-safe seed (`tsx prisma/seed.ts`) |
| `npm test` | Jest unit/integration suites (`__tests__/`) |
| `npm run test:watch` | Jest in watch mode |

## Documentation

- `docs/` — full project documentation (research, architecture, DB, engines, frontend spec)
- `docs/frontend/development-status.md` — verified phase-by-phase frontend status
- `MIGRATION_STATUS.md` — unified-app migration & endpoint inventory (verified)
- `FRONTEND_INTEGRATION_GUIDE.md` — frontend↔API integration guide
- `UNIFIED_MIGRATION_COMPLETE.md` — migration completion record

## Verification (2026-08-17)

- `tsc --noEmit` — 0 errors
- `npm run lint` — 0 errors
- End-to-end smoke: auth (both roles), profile, skills, resume upload/download, applications + evaluations, shortlist transitions, job publish/close, analytics, reports
- Seed state: 20 skills, 6 users, 5 students, 5 jobs, 7 applications, 7 engine-generated evaluations