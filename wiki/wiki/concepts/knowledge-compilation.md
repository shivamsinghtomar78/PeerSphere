---
type: concept
created: 2026-08-15
updated: 2026-08-15
sources:
  - ../../raw/2026-08-15-llm-wiki-pattern.md
tags: [concept, knowledge-management, rag]
---

# Knowledge Compilation

Knowledge compilation is the practice of converting curated source material into a persistent, evolving, interlinked knowledge layer. It contrasts with a raw-only retrieval workflow, where a model must rediscover and synthesize relevant fragments on every question.

## Proposed advantages

- Prior synthesis and cross-references can be reused.
- New material can revise existing understanding rather than live as an isolated upload.
- Contradictions and unanswered questions can become explicit maintenance work.
- Valuable query outputs can become durable notes instead of disappearing in chat history.

## Constraints

The benefit depends on disciplined provenance, review, and maintenance. Generated summaries can omit or misstate source context, so raw sources stay authoritative and claims require links. The approach does not eliminate retrieval, evaluation, or human judgment.

## Connections

- [[wiki-architecture]] defines the required layers.
- [[../processes/ingest|Ingest]] is the mechanism that updates compiled knowledge.
- [[../processes/lint|Lint]] protects consistency over time.
- [[../sources/llm-wiki-pattern|Initial source]] provides the pattern.
