# PeerSphere — Frontend Audit

Scope: `app/(student)/**`, `app/(placement)/**`, `app/auth/**`,
`components/**`, `context/**`, `hooks/**`, `services/*-api.ts`,
`lib/api-client.ts`, `lib/theme-context.tsx`, `styles/**`.

Already-fixed issues from `BUGFIX-TASKS.md` (10 bugs, all `[x]`) are not
re-listed here.

---

## Findings

### 1. `ThemeSwitcher` caused cascading re-renders on every mount (MEDIUM) — FIXED

**File:** `components/layout/ThemeSwitcher.tsx:24-25`.

**Issue:** The component used the standard "hydration-safe mount flag"
pattern:
```tsx
const [mounted, setMounted] = React.useState(false);
React.useEffect(() => setMounted(true), []);
```
This is a real anti-pattern the project's own lint config already
flags as an **error** (`react-hooks/set-state-in-effect`) — calling
`setState` synchronously inside an effect body forces an extra
render-commit-effect cycle on every single mount of every instance of
this component, which sits in the shared navigation/header and mounts
on every page.

**Fix applied:** Replaced the state+effect pair with
`useSyncExternalStore`, which gives the same "has this hydrated on the
client yet" signal without an extra manual render:
```tsx
const mounted = React.useSyncExternalStore(
  () => () => {},  // value never changes after the initial client render
  () => true,      // client snapshot
  () => false      // server snapshot
);
```
Behavior is identical (render the `'system'` default until the client
has taken over, exactly as before) — only the mechanism changed.

**Verify:** `npx eslint components/layout/ThemeSwitcher.tsx` → 0
problems (previously 1 error).

---

### 2. `window.location.assign` for post-logout redirect (LOW, not changed)

**File:** `lib/api-client.ts:34`.

ESLint's `@next/next/no-location-assign-relative-destination` flags
this as a warning, suggesting `useRouter().push()` or `redirect()`
instead. Those don't apply here: this file is a plain axios interceptor
module with no React component/hook context to call them from, and a
full page reload is actually the *correct* choice on this specific
path — it guarantees every in-memory app/query cache is thrown away
along with the cleared tokens, rather than leaving stale
authenticated data in a client cache after logout. Left as-is; noting
it so it isn't "rediscovered" as a bug later.

---

## Scope to improve

- **`no-explicit-any` warnings, concentrated in the client API
  wrapper layer** (`services/student-api.ts`, `services/placement-api.ts`,
  `types/api.ts`) — these are the seams where backend response shapes
  get mapped into frontend types. `any` here means a backend field
  rename wouldn't be caught by the compiler; it'd surface as a runtime
  `undefined` in the UI instead. Worth tightening once the API response
  shapes stabilize — several of the `any`s are exactly at
  `mapBackendEvaluationToMatchResult`-style boundaries, which is also
  where Bug 1 and Bug 2 in `BUGFIX-TASKS.md` originated. Stronger types
  at that seam would have caught both at compile time instead of in
  manual browser testing.
- **Several unused imports left over from refactors** (ESLint
  `no-unused-vars`, ~15 instances — e.g. `BackendStudent`,
  `extractSkillGapsFromEvaluations`, `useState` in `Navigation.tsx`,
  `notFoundError`/`badRequestError`/`ApiError` in a couple of API route
  files). None are bugs, but they're a paper trail of half-finished
  cleanups after the recent migration — worth a single
  `eslint --fix`-assisted pass rather than fixing piecemeal, since
  fixing one at a time across dozens of files this size risks more
  merge noise than value.
- **No client-side error boundary strategy beyond `app/error.tsx`** —
  there's a single root error boundary; a per-portal (student vs.
  placement) boundary would let one broken widget on, say, the
  analytics dashboard fail without taking down the whole placement
  portal shell.
- **Token storage lives in `localStorage`** — see `backend.md`
  Finding/Scope discussion (it's the same architectural decision,
  just implemented on this side in `lib/api-client.ts`'s
  `ACCESS_TOKEN_KEY`/`REFRESH_TOKEN_KEY`).
- **No visual regression / component snapshot testing** — `e2e/` covers
  flows well (accessibility via axe, smoke, admin/student flows), but
  nothing catches a CSS/layout regression like Bug 9's clipped
  department-chart labels before a human notices it in a manual
  walkthrough. A handful of Playwright screenshot assertions on the
  three or four densest dashboard views would catch that class of
  issue for free going forward.
