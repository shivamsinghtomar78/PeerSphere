---
type: process
created: 2026-08-15
updated: 2026-08-15
sources:
  - ../../raw/2026-08-15-llm-wiki-pattern.md
tags: [process, ingest]
---

# Ingest a Source

1. Add a source to `raw/` without altering it. Add downloaded attachments under `raw/assets/`.
2. Read the source and identify its title, date, origin, claims, entities, concepts, evidence, and uncertainty.
3. Create or update a concise `wiki/sources/` provenance note that links to the raw file.
4. Update relevant concept/entity/process pages. Preserve links to old claims and label any contradiction instead of silently overwriting it.
5. Add new pages and one-line summaries to [[../index|index.md]].
6. Append a dated entry to [[../log|log.md]] showing source, changed pages, open questions, and any unresolved conflict.
7. Review the change set with the human curator when the source is sensitive, contested, or high impact.

**Done when:** the source is traceable, affected knowledge is cross-linked, the index is current, and the log records the change.
