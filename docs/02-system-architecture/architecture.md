# Phase 2: System Architecture — Architecture

## Objective

Document the implementation contract for **Architecture** within Phase 2. Defines a modular system: browser client; authenticated API; PostgreSQL; private object storage; asynchronous parsing/matching worker; observability stack; and AI-provider adapter behind a versioned interface.

## Deliverables

- An approved, version-controlled specification for Architecture.
- Traceability to implementation modules, tests, risks, and acceptance evidence.
- Explicit decisions, assumptions, and unresolved questions recorded before build work starts.

## Prerequisites

Phase 1 decisions and risk register are reviewed.

## Implementation Requirements

Defines a modular system: browser client; authenticated API; PostgreSQL; private object storage; asynchronous parsing/matching worker; observability stack; and AI-provider adapter behind a versioned interface.

The implementation must preserve the decision-support boundary: deterministic rules decide explicit eligibility, AI-assisted components produce validated and explainable evidence, and uncertain outcomes are surfaced for human review. Persist input, taxonomy/rule/model versions, timestamps, and actor identity wherever a decision or override is material.

## Tasks

### Task 2.1: Define and implement Architecture

#### Goal

Build the documented capability behind a stable contract without creating hidden assumptions or bypassing authorization, validation, audit, or test requirements.

#### Implementation

1. Convert the requirements in this document into issue-sized work items and link each to a requirement ID.
2. Define request, response, database/event, and UI contracts before implementation.
3. Validate all untrusted input at the boundary; return a typed error without exposing sensitive internals.
4. Make operations idempotent where retries are possible and record versioned provenance for evaluated data.
5. Add observability and audit events for state-changing or sensitive operations.
6. Do not mark the work complete until evidence from all required test layers is attached.

#### Files/Modules

- Planned API: `apps/api/src/modules/architecture/`
- Planned web client: `apps/web/src/features/architecture/`
- Planned tests: `apps/api/test/architecture/` and `apps/web/src/features/architecture/__tests__/`
- Planned contract: `docs/02-system-architecture/api-architecture.md`

#### Dependencies

Phase 1 decisions and risk register are reviewed.

#### Testing

- Unit-test deterministic rules, validation, state transitions, and error handling.
- Integration-test the API, database/storage/worker boundaries, authorization, and audit events.
- Add failure tests for unavailable dependencies, malformed input, permission denial, retries, and stale or inconsistent data.
- When an AI-assisted path applies, evaluate it on labelled fixtures and require schema validation before persistence.

#### Expected Result

A developer can implement and verify Architecture using only this document and its linked architecture, security, data, and test contracts.

#### Acceptance Criteria

- [ ] Requirements are traceable to implementation and tests.
- [ ] Inputs, outputs, permissions, error cases, and state transitions are explicit.
- [ ] Relevant security/privacy controls and audit events are specified.
- [ ] Unit, integration, and failure tests are written and passing.
- [ ] Any AI result is schema-validated, versioned, explainable, and never treated as an autonomous decision.
- [ ] Outstanding risks and limitations are recorded.

#### Status

- [ ] Not Started
- [ ] In Progress
- [ ] Implemented
- [ ] Tested
- [ ] Passed
- [ ] Completed

---

### Task 2.2: Review evidence and release gate

#### Goal

Prove that the capability is safe to integrate with the next phase.

#### Implementation

Collect test reports, sample outputs, performance observations, security findings, migration notes, and reviewer feedback. File defects for failed checks, fix them, repeat the affected tests, and attach the final evidence to the phase completion record.

#### Files/Modules

- `docs/02-system-architecture/phase-completion.md`
- Test reports and CI artifacts for the implementing services.

#### Dependencies

Task 2.1 has implementation and test evidence.

#### Testing

Re-run the complete affected suite in a representative environment after remediation; perform a manual acceptance walk-through using a positive path and at least one failure path.

#### Expected Result

The next phase can depend on a verified contract, not an untested implementation claim.

#### Acceptance Criteria

- [ ] Failed checks have linked defects and verified fixes.
- [ ] Integration checks pass in the intended environment.
- [ ] Reviewers can reproduce the result from recorded fixtures/configuration.
- [ ] No unresolved critical defect remains.

#### Status

- [ ] Not Started
- [ ] In Progress
- [ ] Implemented
- [ ] Tested
- [ ] Passed
- [ ] Completed

## Integration Testing

Verify this capability through its upstream and downstream contracts. Include authorization propagation, validation failures, persistence/queue behavior, audit records, and user-visible loading, error, empty, and success states. Test with anonymized fixtures only; never use real student resumes in ordinary development environments.

## Failure Scenarios

- Invalid, incomplete, duplicated, stale, or conflicting input.
- Unauthorized or cross-tenant/cross-student access attempt.
- Dependent database, storage, worker, or AI-provider timeout/failure.
- Retry, duplicate submission, partial write, and version mismatch.
- Low-confidence, ambiguous, or missing evidence requiring manual review.

## Exit Criteria

All acceptance criteria are evidenced; unit, integration, and failure tests pass; security/privacy implications are reviewed; documentation matches the implemented contract; and an owner approves phase progression.

## Phase Completion Checklist

- [ ] All tasks implemented
- [ ] Unit tests passed
- [ ] Integration tests passed
- [ ] No critical defects
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Phase accepted

+## Frontend Runtime Decision

The browser client is a **Next.js App Router application written in TypeScript and React**. It uses server components for static/read-heavy UI by default and client components only for interactive state, browser APIs, and rich controls. Tailwind CSS and CSS variables provide the design-token layer. The frontend consumes versioned API contracts through typed service modules; it never reimplements eligibility, authorization, matching, or score calculation.

+## Decision Knowledge Record

Architecture research and decision rationale should be maintained in the companion [LLM knowledge wiki](../../Shivam%20singh/wiki/index.md). For every material decision, record the decision in the phase documentation, cite the supporting wiki/source page, state rejected alternatives, and link implementation/evaluation evidence. The wiki stores synthesis; these docs record the approved contract.

+## Concrete Component Contract

| Component | Responsibility | Must not do |
|---|---|---|
| Web client | Forms, dashboards, accessible evidence display, authenticated API calls. | Calculate authoritative eligibility or expose another student's data. |
| API | Authorization, validation, workflow orchestration, query endpoints, transaction boundaries. | Parse untrusted files synchronously or embed provider-specific AI logic. |
| Worker | Scan/extract documents, normalize skills, run evaluation/re-evaluation, retry safe jobs. | Bypass immutable input versions or write unvalidated AI text. |
| PostgreSQL | Transactional entities, versions, workflow state, audit metadata, result snapshots. | Store full binary resumes or provider secrets. |
| Object storage | Private binary source documents and derived artifacts under retention rules. | Grant permanent public URLs. |
| AI adapter | Schema-constrained provider calls, embeddings, retry/circuit-breaker, provider telemetry. | Decide final selection or persist arbitrary output. |

### Processing states

`UPLOADED → QUARANTINED → SCANNED → EXTRACTING → EXTRACTED | NEEDS_MANUAL_REVIEW | FAILED`

Evaluation requests create an immutable input snapshot, then move through `QUEUED → RUNNING → COMPLETED | REVIEW_REQUIRED | FAILED`. A failed job may be retried with a bounded attempt count and an idempotency key. Published job edits create a new job version; they never silently rewrite a past evaluation.
