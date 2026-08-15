---
type: process
created: 2026-08-15
updated: 2026-08-15
sources:
  - ../../raw/2026-08-15-llm-wiki-pattern.md
tags: [process, lint]
---

# Lint the Wiki

Perform a health check after several ingests or before an important synthesis.

- Find orphan or unindexed pages.
- Check broken wikilinks and raw-source links.
- Find important repeated concepts that should have a shared page.
- Identify summaries without provenance.
- Compare related pages for stale claims or contradictions.
- Flag missing evidence, unresolved questions, and candidate sources to investigate.
- Update safe mechanical defects; log all material findings in [[../log|log.md]].

A lint pass improves navigability and transparency; it does not validate every source claim.
