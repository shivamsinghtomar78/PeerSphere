# Phase 0: Project Foundation — Requirements

## Objective

Document the implementation contract for **Requirements** within Phase 0. Lists functional requirements (profiles, resumes, jobs, matching, ranking, overrides) and non-functional requirements (security, latency, auditability, accessibility, reliability).

## Deliverables

- An approved, version-controlled specification for Requirements.
- Traceability to implementation modules, tests, risks, and acceptance evidence.
- Explicit decisions, assumptions, and unresolved questions recorded before build work starts.

## Prerequisites

None. Confirm stakeholders, sample data policy, and institutional approval.

## Implementation Requirements

Lists functional requirements (profiles, resumes, jobs, matching, ranking, overrides) and non-functional requirements (security, latency, auditability, accessibility, reliability).

The implementation must preserve the decision-support boundary: deterministic rules decide explicit eligibility, AI-assisted components produce validated and explainable evidence, and uncertain outcomes are surfaced for human review. Persist input, taxonomy/rule/model versions, timestamps, and actor identity wherever a decision or override is material.

## Tasks

### Task 0.1: Define and implement Requirements

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

- Planned API: `apps/api/src/modules/requirements/`
- Planned web client: `apps/web/src/features/requirements/`
- Planned tests: `apps/api/test/requirements/` and `apps/web/src/features/requirements/__tests__/`
- Planned contract: `docs/02-system-architecture/api-architecture.md`

#### Dependencies

None. Confirm stakeholders, sample data policy, and institutional approval.

#### Testing

- Unit-test deterministic rules, validation, state transitions, and error handling.
- Integration-test the API, database/storage/worker boundaries, authorization, and audit events.
- Add failure tests for unavailable dependencies, malformed input, permission denial, retries, and stale or inconsistent data.
- When an AI-assisted path applies, evaluate it on labelled fixtures and require schema validation before persistence.

#### Expected Result

A developer can implement and verify Requirements using only this document and its linked architecture, security, data, and test contracts.

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

### Task 0.2: Review evidence and release gate

#### Goal

Prove that the capability is safe to integrate with the next phase.

#### Implementation

Collect test reports, sample outputs, performance observations, security findings, migration notes, and reviewer feedback. File defects for failed checks, fix them, repeat the affected tests, and attach the final evidence to the phase completion record.

#### Files/Modules

- `docs/00-project-foundation/phase-completion.md`
- Test reports and CI artifacts for the implementing services.

#### Dependencies

Task 0.1 has implementation and test evidence.

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

+## Requirement Catalogue

### Functional requirements

| ID | Requirement | Verification |
|---|---|---|
| FR-01 | A student can create and update their own academic profile and skill evidence. | API ownership tests and browser journey. |
| FR-02 | A student can upload, replace, and delete an authorized resume version. | Upload security and versioning integration tests. |
| FR-03 | An administrator can create, version, publish, close, and archive a job. | Job-state transition tests. |
| FR-04 | The system extracts requirements and requires administrator confirmation when extraction is uncertain. | Labelled extraction fixtures and manual-correction test. |
| FR-05 | The system evaluates hard eligibility deterministically and explains every failed/unknown rule. | Table-driven eligibility tests. |
| FR-06 | The system returns structured matching, evidence, gaps, recommendations, confidence, and review state. | Contract and end-to-end tests. |
| FR-07 | An administrator can review, shortlist, and override a recommendation with audit history. | RBAC and audit integration tests. |
| FR-08 | A student can view only their own outcomes and a safe, actionable explanation. | Cross-user denial tests and content review. |

### Non-functional requirements

| ID | Target | Verification |
|---|---|---|
| NFR-01 | All sensitive endpoints require authenticated, authorized access. | Authorization matrix test suite. |
| NFR-02 | Resume files are private, encrypted in transit/at rest, malware-scanned, and served via expiring access URLs. | Storage integration and security tests. |
| NFR-03 | API validation produces stable, non-sensitive error responses. | OpenAPI contract tests. |
| NFR-04 | Ordinary read interactions target p95 API latency below 500 ms excluding asynchronous processing. | Load test report; target must be revalidated before launch. |
| NFR-05 | Match evaluations are reproducible from immutable inputs and versioned configuration. | Re-evaluation fixture test. |
| NFR-06 | The web experience meets WCAG 2.2 AA for supported flows. | Automated scan plus manual keyboard/screen-reader review. |
| NFR-07 | Backups and restores meet approved RPO/RTO after a staged restore drill. | Restore evidence; exact RPO/RTO set with the college. |

### Assumptions requiring validation

- The institution is permitted to process resumes and retain a decision audit trail.
- An administrator confirms ambiguous job requirements before automated candidate evaluation.
- Launch regions, retention periods, legal basis, and accessibility support matrix are approved before production.
