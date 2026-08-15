# LLM-Maintained Knowledge Wiki Workflow

## Purpose

The software-development documentation in this repository is complemented by an Obsidian-compatible knowledge wiki at [Shivam singh](../Shivam%20singh/README.md). The wiki is a maintained research and decision-support layer: it does not replace reviewed phase documentation, source-control review, or test evidence.

## Architecture

| Layer | Location | Change policy |
|---|---|---|
| Raw sources | [Shivam singh/raw](../Shivam%20singh/raw/) | Immutable after capture. |
| Generated knowledge wiki | [Shivam singh/wiki](../Shivam%20singh/wiki/index.md) | LLM-maintained, source-linked Markdown. |
| Wiki schema | [Shivam singh/AGENTS.md](../Shivam%20singh/AGENTS.md) | Defines source, query, and lint workflows. |
| Deliverable documentation | [docs](README.md) | Reviewed, phase-based implementation contract. |

## Rules for PeerSphere Work

1. Put research articles, policy decisions, approved meeting notes, and anonymized technical references in the vault's `raw/` folder.
2. Ingest each source before relying on it: create a provenance note, update cross-links, update the index, and append the log.
3. Promote only reviewed conclusions into phase documentation. Link to the wiki/source where it informs an architecture decision.
4. Treat raw sources and test artifacts as authoritative over an LLM-generated synthesis.
5. Never store secrets, real student resumes, credentials, or unapproved PII in the vault.
6. Run a wiki lint before architecture reviews, major model/provider changes, or a final demo.

## Development Use Cases

- Maintain a decision log for architecture and AI-evaluation research.
- Compile research on skills taxonomies, resume parsing, fairness, privacy, and placement policies.
- Save durable comparisons and risk analyses generated during implementation.
- Surface contradictory requirements before they become implementation defects.

## Definition of Done Addition

When a development decision depends on research, the relevant source is captured, the wiki synthesis is traceable, the final phase document records the decision, and implementation/testing evidence confirms it. A wiki note alone is not implementation evidence.
