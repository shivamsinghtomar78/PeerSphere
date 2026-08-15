---
type: concept
created: 2026-08-15
updated: 2026-08-15
sources:
  - ../../raw/2026-08-15-llm-wiki-pattern.md
tags: [concept, architecture, knowledge-wiki]
---

# Wiki Architecture

The wiki uses three distinct layers.

| Layer | Location | Ownership | Rule |
|---|---|---|---|
| Raw sources | `raw/` | Human-curated | Immutable source of truth. |
| Generated wiki | `wiki/` | LLM-maintained with human oversight | Interlinked synthesis, summaries, and analyses. |
| Schema | `AGENTS.md` | Human and LLM co-maintained | Defines conventions and workflows. |

The separation prevents a generated note from silently replacing original material. [[../index|index.md]] is content-oriented navigation; [[../log|log.md]] is an append-only timeline. As the vault grows, a local search tool may complement—but should not replace—these explicit structures.

See [[knowledge-compilation]] and [[../processes/ingest]].
