# Phase 2: System Architecture — Api Architecture

## Objective

Document the implementation contract for **Api Architecture** within Phase 2. Defines REST JSON APIs under /api/v1, resource-oriented routes, schema validation, stable error envelopes, cursor pagination, idempotency for writes, and OpenAPI as the contract.

## Deliverables

- An approved, version-controlled specification for Api Architecture.
- Traceability to implementation modules, tests, risks, and acceptance evidence.
- Explicit decisions, assumptions, and unresolved questions recorded before build work starts.

## Prerequisites

Phase 1 decisions and risk register are reviewed.

## Implementation Requirements

Defines REST JSON APIs under /api/v1, resource-oriented routes, schema validation, stable error envelopes, cursor pagination, idempotency for writes, and OpenAPI as the contract.

The implementation must preserve the decision-support boundary: deterministic rules decide explicit eligibility, AI-assisted components produce validated and explainable evidence, and uncertain outcomes are surfaced for human review. Persist input, taxonomy/rule/model versions, timestamps, and actor identity wherever a decision or override is material.

## Tasks

### Task 2.1: Define and implement Api Architecture

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

- Planned API: `apps/api/src/modules/api-architecture/`
- Planned web client: `apps/web/src/features/api-architecture/`
- Planned tests: `apps/api/test/api-architecture/` and `apps/web/src/features/api-architecture/__tests__/`
- Planned contract: `docs/02-system-architecture/api-architecture.md`

#### Dependencies

Phase 1 decisions and risk register are reviewed.

#### Testing

- Unit-test deterministic rules, validation, state transitions, and error handling.
- Integration-test the API, database/storage/worker boundaries, authorization, and audit events.
- Add failure tests for unavailable dependencies, malformed input, permission denial, retries, and stale or inconsistent data.
- When an AI-assisted path applies, evaluate it on labelled fixtures and require schema validation before persistence.

#### Expected Result

A developer can implement and verify Api Architecture using only this document and its linked architecture, security, data, and test contracts.

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

+## Initial API Surface

All routes are prefixed with `/api/v1`. Responses use JSON and UTC ISO-8601 timestamps. Every error has `code`, `message`, `requestId`, and optional field `details`; errors never include stack traces or private evidence.

| Method | Route | Role | Purpose |
|---|---|---|---|
| GET/PATCH | /students/me | STUDENT | Read/update own profile. |
| POST/GET/DELETE | /students/me/resumes | STUDENT | Initiate upload, list versions, request deletion. |
| GET | /students/me/evaluations | STUDENT | Read own explainable results. |
| POST/GET/PATCH | /jobs | PLACEMENT_ADMIN | Create/list/update job drafts and versions. |
| POST | /jobs/{jobId}/publish | PLACEMENT_ADMIN | Validate and publish a job version. |
| GET | /jobs/{jobId}/candidates | PLACEMENT_ADMIN | Read paginated/filterable candidates. |
| POST | /jobs/{jobId}/evaluations | PLACEMENT_ADMIN | Queue evaluation/re-evaluation. |
| POST | /evaluations/{id}/override | PLACEMENT_ADMIN | Record a reasoned human override. |

Write requests accept `Idempotency-Key`; duplicate keys with identical payload return the original result. Cursor pagination is mandatory for candidate lists. OpenAPI is the source of truth and generated clients must not replace server-side schema validation.
