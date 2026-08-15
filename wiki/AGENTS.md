# Knowledge Wiki Maintainer

This Obsidian vault is a persistent knowledge base. The LLM maintains the generated wiki; raw source files are immutable.

## Directory Contract

- `raw/` contains original sources. Do not edit or delete their contents. Put attachments in `raw/assets/`.
- `wiki/` contains generated and maintained Markdown notes.
- `wiki/index.md` is the content-oriented catalog. Update it whenever a wiki page is added, renamed, or retired.
- `wiki/log.md` is append-only. Record every ingest, material query output, and lint pass.
- `templates/` holds reusable page shapes.
- `AGENTS.md` is the schema and workflow contract.

## Note Conventions

- Write clear Markdown using Obsidian wikilinks, for example `[[concepts/knowledge-compilation]]`.
- Add YAML frontmatter to generated wiki pages: `type`, `created`, `updated`, `sources`, and `tags`.
- Cite raw sources with a relative Markdown link and distinguish a source claim from an inference.
- Preserve uncertainty. Use **Open question**, **Contradiction**, or **Inference** labels where appropriate.
- Do not invent facts, citations, or source support.
- Update related summaries and links when a new source changes them.

## Ingest Workflow

1. Identify one or more new files in `raw/`; treat their contents as immutable.
2. Read the source and create/update a provenance note in `wiki/sources/`.
3. Extract durable concepts, entities, processes, and disagreements into appropriately named wiki pages.
4. Update cross-links and the relevant synthesis/overview pages.
5. Update `wiki/index.md`.
6. Append a dated ingest record to `wiki/log.md`.
7. Report what changed, uncertainties, and suggested next questions.

## Query Workflow

1. Read `wiki/index.md`, then the relevant linked pages.
2. Answer from the wiki with source links.
3. Label inferences and unresolved gaps.
4. If the answer creates durable value, save it as a `wiki/analyses/` note, update the index, and log it.

## Lint Workflow

Periodically inspect for orphan pages, broken links, duplicate concepts, stale claims, uncited summaries, contradictions, missing source notes, and unindexed pages. Make safe mechanical fixes; log material findings and leave substantive disputes clearly labelled.

## Safety and Privacy

Do not add private credentials, production personal data, or unapproved student resumes to this vault. Keep sensitive source files out of shared Git history unless their retention and access rules are approved.
