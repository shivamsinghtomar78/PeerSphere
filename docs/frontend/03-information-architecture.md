# 03 — Information Architecture

## MVP role navigation

```text
Student
├── Dashboard
├── Jobs (recommended, all, detail)
├── Applications
├── Match analysis
├── Skill gaps
├── Recommendations
├── Resume
└── Profile

Placement administrator
├── Dashboard
├── Students
├── Jobs (draft, published, closed)
├── Applications
├── Candidates (ranking, detail, comparison)
├── Skill-gap analytics
├── Placement analytics
└── Reports
```

## Deferred role navigation

Recruiter and system-admin experiences are documented as future, policy-gated extensions. The initial product authorizes only STUDENT and PLACEMENT_ADMIN; adding recruiter or admin roles requires an approved access model, data-sharing policy, and backend authorization work.

## Route Rules

Use route groups by role, server-side route protection, breadcrumbs for deep pages, and stable URL parameters for job, candidate, and evaluation IDs. Never expose another student's identifier in student navigation.

## Acceptance Criteria

- [ ] Every primary task has a discoverable route and a return path.
- [ ] Navigation maps exactly to authorized capabilities.
