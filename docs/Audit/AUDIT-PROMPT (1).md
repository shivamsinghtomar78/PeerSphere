# Codebase Audit Prompt — Frontend & Backend

Reusable prompt for auditing a repo (used here on PeerSphere). Paste this to
Claude (or adapt for any reviewer/agent) with repo access.

---

## Prompt

> You are auditing the codebase at `<repo path or URL>`. Produce a real,
> evidence-based bug and risk audit — not a generic best-practices list.
>
> **Setup**
> 1. Clone/open the repo and map its structure. Identify what counts as
>    "frontend" (UI, client state, client-side API wrappers) vs "backend"
>    (API routes/handlers, services, database layer, auth/middleware) —
>    state this mapping explicitly if the repo is a unified framework
>    (e.g. Next.js App Router) rather than two separate codebases.
> 2. Check for and read any existing bug logs, migration notes, or
>    architecture docs in the repo first (`BUGFIX*.md`, `CHANGELOG`,
>    `*STATUS*.md`, `AGENTS.md`/`CLAUDE.md`). Do not re-report issues
>    already fixed there — audit for what's still open.
> 3. Install dependencies and run, in this order, capturing raw output:
>    - Typecheck (`tsc --noEmit` or language equivalent)
>    - Lint (`eslint` / `ruff` / etc.)
>    - Existing test suite
>    - Build
>    If any step fails for environment reasons (e.g. a package needs
>    network access the sandbox blocks), say so explicitly and exclude
>    those specific errors from findings rather than reporting
>    environment noise as code bugs.
>
> **Backend review — read the actual source, don't guess:**
> - Auth: token/session handling, secret management, password hashing,
>   rate limiting on login/signup, authorization checks on every
>   mutating route (not just presence of a middleware, but that each
>   handler actually enforces the right role/ownership).
> - Input handling: is every external input (body, query, params,
>   uploaded files) validated against a schema, and validated by
>   **content**, not just by client-supplied labels (MIME type,
>   filename, `Content-Type` header) that an attacker fully controls?
> - Data access: N+1 queries, missing pagination, missing indexes on
>   hot filters, business rules bypassable via a missing check (e.g. a
>   deadline never enforced server-side).
> - Error handling: do failures leak stack traces/internals, or fail
>   silently in a way that hides a bug from users and logs alike?
> - File/storage handling: path traversal via user-controlled
>   filenames, unbounded upload size, no antivirus/content check.
>
> **Frontend review:**
> - State/data-fetch bugs: stale closures, effects that double-fetch,
>   race conditions between fetch and dependent state.
> - Hydration correctness (SSR frameworks): any value that can differ
>   between server and first client render without a guard.
> - Auth/session UX: expired-session handling, dead buttons (no
>   handler wired up), broken deep links, hard-coded "select first
>   item" instead of respecting a passed ID.
> - Accessibility and duplicate-key/render warnings from the console.
> - Type safety: `any` usage that silently defeats the type system at
>   a security- or data-integrity-relevant boundary (not just style).
>
> **Output**
> Produce two files: `frontend.md` and `backend.md`. For each finding:
> severity, exact file/line, repro or how you found it, root cause, and
> the fix (applied, or proposed if out of safe scope for this pass).
> End each file with a **Scope to improve** section: real, non-generic
> opportunities you noticed while reading the code (not a boilerplate
> "add more tests" list) — architectural trade-offs, hardening options,
> and known-but-not-urgent risks worth a deliberate decision later.
>
> Then fix what's safely fixable in this pass: isolated, verifiable
> bugs. Do not attempt large refactors (e.g. swapping an entire auth
> storage model) in the same pass — document those as scope items with
> the trade-off explained, so a human decides when to do them.

---

## Why this shape

- **Read-existing-logs-first** avoids wasting the pass re-discovering
  bugs the team already fixed (PeerSphere had a `BUGFIX-TASKS.md` with
  10 already-resolved issues — duplicating those would've been noise).
- **Environment-vs-real-bug separation** matters because a sandboxed
  audit environment can fail to reach a package registry or binary
  host (here: Prisma's engine binaries), producing cascading type
  errors that look like code bugs but are actually just "this sandbox
  couldn't finish an install step." Reporting those as real bugs would
  mislead the team.
- **Content over label validation** is the single highest-value
  backend check for any app that accepts uploads — it catches a whole
  class of spoofing bugs generic linters never will.
- **Fix small, document big** keeps the pass safe: a 30-minute audit
  session is the wrong place to redesign auth token storage, but it's
  exactly the right place to flag it with the trade-off spelled out.
