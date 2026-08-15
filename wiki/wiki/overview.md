---
type: overview
created: 2026-08-15
updated: 2026-08-15
sources:
  - ../raw/2026-08-15-llm-wiki-pattern.md
tags: [overview, knowledge-wiki]
---

# LLM-Maintained Knowledge Wiki

This vault implements an initial version of the [[concepts/knowledge-compilation]] pattern: knowledge is compiled into maintained Markdown rather than reconstructed only from raw documents at question time.

The design is intentionally small:

1. Put untouched material in `raw/`.
2. Ask the LLM to ingest it.
3. Read and navigate synthesized notes in `wiki/`.
4. Use [[index]] to find material and [[log]] to understand change history.
5. Ask for a [[processes/lint|lint pass]] as the wiki grows.

## Current understanding

The source proposes that persistent cross-links, contradiction tracking, and source-aware synthesis reduce repeated research effort. At small scale, structured Markdown plus an index can be sufficient; search tools are optional scale-up infrastructure.

## Boundaries

This wiki contains generated interpretations. Raw sources remain the authority. A wiki note must link to its supporting source(s), flag inference, and avoid claiming that an LLM-generated summary is independently verified.

## Related notes

- [[concepts/wiki-architecture]]
- [[processes/ingest]]
- [[processes/query]]
- [[processes/lint]]
- [[sources/llm-wiki-pattern]]
