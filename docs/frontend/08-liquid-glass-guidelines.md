# 08 — Liquid Glass Guidelines

## Purpose and Placement

Glass is navigation and control chrome: sidebar, header, bottom navigation, filters, dialogs, sheets, selected segmented controls, and floating actions. Keep lists, tables, reading areas, and most Bento data cards opaque for legibility and GPU efficiency.

## Categories

| Category | Use |
|---|---|
| Glass Navigation | Persistent sidebar, header, bottom navigation. |
| Glass Control | Buttons, filters, tabs, search, selected controls. |
| Glass Floating | One focused floating action or compact utility panel. |
| Glass Overlay | Dialogs, sheets, menus, popovers. |
| Glass Subtle / Strong | Subtle for low-emphasis controls; strong for active navigation or modal focus. |

## Material Rules

Use a backdrop only when there is meaningful content behind it. Define opacity, blur, border, highlight, and shadow tokens per category. Never nest independent backdrop-filter layers. Focus rings sit outside the glass boundary. Hover changes border/highlight before increasing blur. Disabled controls reduce emphasis but preserve text contrast.

## Fallback

When `prefers-reduced-transparency`, low-performance telemetry, or browser support makes glass unsuitable, render an opaque semantic surface with the same layout and focus behavior.

## Acceptance Criteria

- [ ] No dense scrolling list contains a glass layer per row.
- [ ] Glass and fallback variants meet contrast and keyboard-focus checks.
