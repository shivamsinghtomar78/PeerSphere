# 14 — Animation and Motion

Use 100–180ms for micro feedback, 180–300ms for standard transitions, and 250–400ms for dialogs/sheets. Prefer opacity, transform, and color transitions; do not animate blur continuously in scrolling areas. Use one consistent ease-out entry and ease-in exit curve.

Motion explains state change: opening a filter sheet, revealing evidence detail, confirming publish, or moving a selected tab. It must not be decorative noise. Respect `prefers-reduced-motion` by removing nonessential movement and using immediate/opacity-only transitions.

## Acceptance Criteria

- [ ] Every animated state remains comprehensible with motion disabled.
- [ ] No animation delays a safety-critical status or primary action.
