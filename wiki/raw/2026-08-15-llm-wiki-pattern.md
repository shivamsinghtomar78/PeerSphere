# Source: LLM Wiki Pattern

- **Captured:** 2026-08-15
- **Origin:** User-provided pasted text
- **Integrity:** Immutable raw source; do not modify

## Summary supplied with the source

LLM Wiki is a pattern for personal knowledge bases where an LLM maintains a persistent, interlinked Markdown wiki instead of re-deriving answers directly from a raw-document RAG collection. Raw sources remain immutable. The generated wiki is updated as new material arrives: entity pages, concept pages, summaries, cross-references, contradictions, and synthesis are revised. A schema file directs the LLM's structure and workflows.

The operating model has three layers:

1. **Raw sources** — immutable curated documents, images, and data files.
2. **Wiki** — LLM-generated Markdown pages containing summaries, entities, concepts, comparisons, and synthesis.
3. **Schema** — maintainer instructions defining structure and workflows.

Core operations:

- **Ingest:** read a new source; create a summary/source page; update affected concepts/entities and the index; append to the log.
- **Query:** consult the index and relevant notes; produce a cited synthesis; optionally file durable results back into the wiki.
- **Lint:** identify contradictions, stale claims, orphan pages, missing concepts/cross-links, and data gaps.

Special files:

- `index.md`: catalog of wiki pages, organized by category with links and one-line summaries.
- `log.md`: append-only chronological record. Consistent dated headings make it easy to inspect recent activity.

At modest scale, index-driven Markdown navigation can be sufficient without embedding RAG. At larger scale, optional local search (for example hybrid BM25/vector search) may help. Obsidian graph view, Dataview frontmatter, local attachments, and Git history are complementary tools.

The central claim is that the LLM removes the bookkeeping burden: the wiki becomes a compounding, maintained artifact while people curate sources, direct exploration, and assess meaning. The approach is inspired in spirit by Memex and is intentionally adaptable rather than a prescribed implementation.
