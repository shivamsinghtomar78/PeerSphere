# 05 — User Flows

## Student match flow

`Dashboard → Recommended job → Job detail → Apply → Processing status → Match analysis → Skill gaps → Improvement roadmap → Profile/resume update`

## Placement flow

`Jobs → Create draft → Define/confirm requirements → Publish → Candidates → Filter/rank → Inspect evidence → Review low confidence → Shortlist or override → Notify`

## Failure flow

`Upload or analysis failure → clear cause when safe → retry or manual-review route → preserved draft/input → support path`

## Interaction Rules

Destructive actions require confirmation. A job publish flow is a multi-step review, not a one-page form. Shortlisting an evaluation with mandatory review is blocked until an authorized reviewer records a decision.

## Acceptance Criteria

- [ ] Every flow includes loading, error, empty, and success states.
- [ ] Each transition has a clear owner and reversible action where feasible.
