# PeerSphere Development Documentation

## Project Overview

PeerSphere is an AI-assisted placement-management platform for a college placement cell. It accepts student profiles and resumes plus job descriptions, then produces deterministic eligibility results, evidence-backed match scores, ranked candidates, skill-gap feedback, confidence, and human-review flags. It is a **decision-support system**: placement staff retain the final decision and may override a recommendation with an audited reason.

## Baseline Architecture

```text
React + TypeScript web client
        │ HTTPS / OpenAPI
Node + TypeScript API ─── PostgreSQL
        │                 │
        ├── private object storage (resumes)
        ├── asynchronous parse/match workers + queue
        └── AI adapter: extraction / embeddings / explanation
                         │
                schema validation, versioning, fallback
```

Hard requirements (CGPA, branch, graduation year, backlogs) are evaluated by deterministic rules. Soft requirements use a taxonomy, source-backed evidence, lexical and semantic similarity, and transparent weighted scoring. An LLM may assist extraction or explanation only behind schema validation; it never directly writes a hiring decision.

## Development Phases

Follow phases in sequence unless the prerequisite list explicitly permits parallel work. Read the phase document, verify prerequisites, implement, write and run unit tests, repair failures, run integration and failure tests, update the document, then record status. Checkboxes remain pending because this repository contains planning documentation, not verified implementation evidence.

| Phase | Name | Status | Tests | Completion |
|---|---|---|---|---|
| 0 | Foundation | Pending | Pending | 0% |
| 1 | Research and feasibility | Pending | Pending | 0% |
| 2 | System architecture | Pending | Pending | 0% |
| 3 | Database | Pending | Pending | 0% |
| 4 | Authentication and authorization | Pending | Pending | 0% |
| 5 | Student module | Pending | Pending | 0% |
| 6 | Placement cell module | Pending | Pending | 0% |
| 7 | Resume and JD processing | Pending | Pending | 0% |
| 8 | AI matching engine | Pending | Pending | 0% |
| 9 | Skill gap analysis | Pending | Pending | 0% |
| 10 | Placement workflow | Pending | Pending | 0% |
| 11 | Frontend | Pending | Pending | 0% |
| 12 | Testing and validation | Pending | Pending | 0% |
| 13 | Security and privacy | Pending | Pending | 0% |
| 14 | DevOps and deployment | Pending | Pending | 0% |
| 15 | Final integration | Pending | Pending | 0% |
| 16 | Project completion | Pending | Pending | 0% |

## Dependency Order

```text
0 Foundation → 1 Research → 2 Architecture → 3 Database → 4 Auth
                                                     ├→ 5 Student module
                                                     └→ 6 Placement module
5 + 6 → 7 Processing → 8 Matching → 9 Skill gaps → 10 Workflow → 11 Frontend
→ 12 Validation → 13 Security/privacy → 14 DevOps → 15 Integration → 16 Completion
```

Phases 5 and 6 can proceed in parallel only after Phases 2–4 provide stable contracts. Phase 11 may start component work once APIs and workflow states are stable, but its acceptance depends on integrated flows.

## How to Use This Documentation

1. Start at [Phase 0](00-project-foundation/project-overview.md) and complete its reviewable artifacts.
2. Treat each document's Implementation Requirements and Tasks as the work contract.
3. Do not change a task to Completed until its stated unit, integration, failure, and acceptance checks have passed.
4. Record changed assumptions, defects, version identifiers, and evidence in the relevant phase-completion document.
5. Before release, execute the final-integration and completion checklists using a non-production, anonymized test dataset.

## Testing Philosophy

Tests are a release condition, not a final cleanup step. Every meaningful feature needs deterministic unit tests, integration tests across real boundaries, negative/failure tests, and an acceptance walkthrough. Failed tests create a defect; the test is rerun after the fix. Test fixtures must be anonymized and must include malformed files, missing data, duplicated aliases, conflicting evidence, provider failures, and unauthorized access.

## AI Evaluation Philosophy

AI outputs are probabilistic assistance, never proof of competence or hiring suitability. Maintain a human-labelled, versioned evaluation set. Measure extraction accuracy, precision, recall, F1, false positives, false negatives, ranking quality, confidence calibration, and relevant fairness slices. Block release when agreed thresholds regress. Low confidence mandates human review; medium confidence recommends review; high confidence remains a recommendation only.

## Definition of Done

A feature is done only when the code and required tests are passing, error and security paths are verified, data/API/UI changes are documented, AI behavior is evaluated where relevant, no critical defect remains, acceptance criteria are satisfied, and review evidence is recorded. Written code alone is not completion.

+## Approved Frontend Technology Baseline

The frontend baseline is **Next.js (App Router) with TypeScript**, React, Tailwind CSS, CSS variables, modern CSS, Framer Motion (or an equivalent reduced-motion-aware library), and Lucide React (or a single consistent icon library). See [Frontend UI/UX Specification](frontend/README.md). Backend technology remains a planning baseline until Phase 1 evaluation approves it.

+## Knowledge Wiki Companion

The project also maintains an Obsidian-compatible, LLM-managed knowledge base in [Shivam singh](../Shivam%20singh/README.md). Use it to ingest immutable research/policy sources, maintain linked synthesis, and record questions or contradictions. The phase documentation remains the authoritative implementation plan and release record. See [Knowledge Wiki Workflow](knowledge-wiki-workflow.md) for the boundary and maintenance rules.
