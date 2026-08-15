# 20 — Recruiter Experience (Future, Policy-Gated)

Recruiter UI is intentionally not part of the MVP because the current authorization design has only STUDENT and PLACEMENT_ADMIN. If approved later, recruiter navigation includes Dashboard, Jobs, Candidates, Candidate Detail, and Applications.

A recruiter must see only candidates and fields explicitly shared for that recruiter’s job(s); aggregate reporting cannot become a route to browse unrelated students. Requirements, approval workflow, audit events, retention, consent, and role permissions must be defined before implementation.

## Acceptance Criteria

- [ ] No recruiter route is implemented or exposed until the role and data-sharing model are approved.
