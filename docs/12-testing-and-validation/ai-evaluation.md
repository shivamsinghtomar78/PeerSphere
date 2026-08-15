# Phase 12: Testing and Validation — AI Evaluation

## Objective

Document the implementation contract for **AI Evaluation** within Phase 12. Defines labelled held-out test sets, annotator instructions, metrics, slices, calibration, regression thresholds, human review of errors, and a prohibition on unvalidated model changes.

## Deliverables

- An approved, version-controlled specification for AI Evaluation.
- Traceability to implementation modules, tests, risks, and acceptance evidence.
- Explicit decisions, assumptions, and unresolved questions recorded before build work starts.

## Prerequisites

Each implemented module exposes stable, testable contracts and seeded fixtures.

## Implementation Requirements

Defines labelled held-out test sets, annotator instructions, metrics, slices, calibration, regression thresholds, human review of errors, and a prohibition on unvalidated model changes.

The implementation must preserve the decision-support boundary: deterministic rules decide explicit eligibility, AI-assisted components produce validated and explainable evidence, and uncertain outcomes are surfaced for human review. Persist input, taxonomy/rule/model versions, timestamps, and actor identity wherever a decision or override is material.

## Tasks

### Task 12.1: Define and implement AI Evaluation

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

- Planned API: `apps/api/src/modules/ai-evaluation/`
- Planned web client: `apps/web/src/features/ai-evaluation/`
- Planned tests: `apps/api/test/ai-evaluation/` and `apps/web/src/features/ai-evaluation/__tests__/`
- Planned contract: `docs/02-system-architecture/api-architecture.md`

#### Dependencies

Each implemented module exposes stable, testable contracts and seeded fixtures.

#### Testing

- Unit-test deterministic rules, validation, state transitions, and error handling.
- Integration-test the API, database/storage/worker boundaries, authorization, and audit events.
- Add failure tests for unavailable dependencies, malformed input, permission denial, retries, and stale or inconsistent data.
- When an AI-assisted path applies, evaluate it on labelled fixtures and require schema validation before persistence.

#### Expected Result

A developer can implement and verify AI Evaluation using only this document and its linked architecture, security, data, and test contracts.

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

### Task 12.2: Review evidence and release gate

#### Goal

Prove that the capability is safe to integrate with the next phase.

#### Implementation

Collect test reports, sample outputs, performance observations, security findings, migration notes, and reviewer feedback. File defects for failed checks, fix them, repeat the affected tests, and attach the final evidence to the phase completion record.

#### Files/Modules

- `docs/12-testing-and-validation/phase-completion.md`
- Test reports and CI artifacts for the implementing services.

#### Dependencies

Task 12.1 has implementation and test evidence.

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

+## Evaluation Dataset and Release Gates

Maintain a versioned, access-controlled, anonymized dataset with JD, student evidence, gold requirements, gold eligibility, gold requirement matches, and at least two reviewer labels or documented adjudication. Split by job family and time period to prevent leakage.

For each candidate release, report extraction precision/recall/F1, hard-rule accuracy, match precision/recall/F1, gap accuracy, NDCG@k and pairwise ranking agreement, confidence calibration, false-positive/negative samples, and quality by approved non-sensitive slices. Establish baselines in Phase 1; values are release gates only after stakeholders approve their thresholds.

Any regression, new provider/model, taxonomy version, prompt change, or scoring change requires a held-out evaluation, error analysis, and rollback plan. Never use a single aggregate score to claim unbiased or 100% accurate matching.
