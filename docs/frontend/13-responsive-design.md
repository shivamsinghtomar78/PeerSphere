# 13 - Responsive Design

| Range | Layout |
|---|---|
| Mobile < 640px | Single-priority column, glass header + bottom navigation, stacked comparisons, filter sheet. |
| Tablet 640-1023px | Two-column summaries, collapsible sidebar, compact tables or card alternatives. |
| Laptop 1024-1439px | Persistent sidebar, 12-column content grid, normal data tables. |
| Desktop >= 1440px | Wider dashboard spans, comparison views, no uncontrolled line length. |

Test at 320px, 375px, 768px, 1024px, 1440px, and 1920px plus browser zoom. Reorder cards by urgency on mobile. A table may become a labeled candidate card only when comparing rows is not the task; otherwise offer accessible horizontal scroll with pinned identifiers.

## Implementation (verified 2026-08-17)

| Requirement | Implementation |
|---|---|
| Breakpoints | Tailwind defaults: `sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536; all grids are mobile-first (`grid-cols-1` base). |
| App shell | Desktop: collapsible sidebar (lg+). Mobile: glass header + drawer + bottom nav with safe-area insets (`env(safe-area-inset-bottom)`); content reserves bottom-nav height. |
| Tables | All data tables wrapped in `overflow-x-auto` (students, applications, candidates, compare). |
| Tabs | `GlassTabs` horizontal scroll rail (`no-scrollbar`) with `whitespace-nowrap` items. |
| Dialogs | `GlassDialog` scrolls independently within dvh max-height; scrim fixed; footer wraps. |
| Toasts | <=480px: full-width gutter (left/right 16px); desktop: bottom-right; z-index token. |
| Touch targets | `@media (pointer: coarse)` — buttons/tabs/role=button min-height 44px. |
| iOS zoom | Inputs/selects/textareas render at 16px on coarse pointers; `GlassInput` uses `text-base sm:text-sm`. |
| Horizontal overflow | `body { overflow-x: hidden }` + `no-scrollbar` utility. |

## Acceptance Criteria

- [x] No horizontal page scroll at supported widths.
- [x] Touch targets are at least 44x44 CSS px where appropriate.