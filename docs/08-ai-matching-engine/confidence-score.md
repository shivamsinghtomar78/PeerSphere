# Phase 8: AI Matching Engine — Confidence Score

## Objective

Document the implementation contract for **Confidence Score** within Phase 8. Defines confidence from extraction completeness, evidence coverage, similarity margin, rule ambiguity, parser quality, and model health. It is not a claim of hiring probability.

## Deliverables

- An approved, version-controlled specification for Confidence Score.
- Traceability to implementation modules, tests, risks, and acceptance evidence.
- Explicit decisions, assumptions, and unresolved questions recorded before build work starts.

## Prerequisites

Phase 7 supplies validated, versioned requirements and candidate evidence.

## Implementation Requirements

Defines confidence from extraction completeness, evidence coverage, similarity margin, rule ambiguity, parser quality, and model health. It is not a claim of hiring probability.

The implementation must preserve the decision-support boundary: deterministic rules decide explicit eligibility, AI-assisted components produce validated and explainable evidence, and uncertain outcomes are surfaced for human review. Persist input, taxonomy/rule/model versions, timestamps, and actor identity wherever a decision or override is material.

## Tasks

### Task 8.1: Define and implement Confidence Score

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

- Planned API: `apps/api/src/modules/confidence-score/`
- Planned web client: `apps/web/src/features/confidence-score/`
- Planned tests: `apps/api/test/confidence-score/` and `apps/web/src/features/confidence-score/__tests__/`
- Planned contract: `docs/02-system-architecture/api-architecture.md`

#### Dependencies

Phase 7 supplies validated, versioned requirements and candidate evidence.

#### Testing

- Unit-test deterministic rules, validation, state transitions, and error handling.
- Integration-test the API, database/storage/worker boundaries, authorization, and audit events.
- Add failure tests for unavailable dependencies, malformed input, permission denial, retries, and stale or inconsistent data.
- When an AI-assisted path applies, evaluate it on labelled fixtures and require schema validation before persistence.

#### Expected Result

A developer can implement and verify Confidence Score using only this document and its linked architecture, security, data, and test contracts.

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

### Task 8.2: Review evidence and release gate

#### Goal

Prove that the capability is safe to integrate with the next phase.

#### Implementation

Collect test reports, sample outputs, performance observations, security findings, migration notes, and reviewer feedback. File defects for failed checks, fix them, repeat the affected tests, and attach the final evidence to the phase completion record.

#### Files/Modules

- `docs/08-ai-matching-engine/phase-completion.md`
- Test reports and CI artifacts for the implementing services.

#### Dependencies

Task 8.1 has implementation and test evidence.

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

+## Confidence and Review Policy

Confidence measures confidence in the **quality of this evaluation**, not the chance that a student will be hired.

```text
confidence = round(100 × (
  0.30 × extraction_completeness +
  0.25 × evidence_coverage +
  0.20 × match_margin +
  0.15 × input_consistency +
  0.10 × service_health
))
```

All factors are normalized to [0,1] and persisted with the output. Start with the following policy, then calibrate it on labelled data:

| Confidence | Workflow |
|---|---|
| 80–100 | Normal recommendation; human remains able to review. |
| 55–79 | `reviewRecommended=true`; administrator sees missing/ambiguous evidence. |
| 0–54 | `requiresHumanReview=true`; shortlist action is blocked until a recorded review. |

Force mandatory review regardless of numeric confidence when hard-rule data is missing/conflicting, extraction schema validation failed, document quality is poor, provider fallback was used, or fairness/safety monitoring flags the case.
