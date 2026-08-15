# 13 — Responsive Design

| Range | Layout |
|---|---|
| Mobile < 640px | Single-priority column, glass header + bottom navigation, stacked comparisons, filter sheet. |
| Tablet 640–1023px | Two-column summaries, collapsible sidebar, compact tables or card alternatives. |
| Laptop 1024–1439px | Persistent sidebar, 12-column content grid, normal data tables. |
| Desktop ≥ 1440px | Wider dashboard spans, comparison views, no uncontrolled line length. |

Test at 320px, 375px, 768px, 1024px, 1440px, and 1920px plus browser zoom. Reorder cards by urgency on mobile. A table may become a labeled candidate card only when comparing rows is not the task; otherwise offer accessible horizontal scroll with pinned identifiers.

## Acceptance Criteria

- [ ] No horizontal page scroll at supported widths.
- [ ] Touch targets are at least 44×44 CSS px where appropriate.
