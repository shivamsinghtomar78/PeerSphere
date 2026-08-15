# 07 — Design System

## Token Architecture

Define semantic CSS variables for canvas, surface, glass, border, text, muted text, focus, and semantic states. Tailwind consumes these variables rather than hard-coded colors. Components use semantic tokens, so light/dark and reduced-transparency variants are centralized.

## Component Layers

1. Foundations: tokens, typography, spacing, elevation, radii.
2. Primitives: button, input, badge, dialog, sheet, tabs, table.
3. Glass primitives: navigation/control/overlay variants only.
4. Product components: match score, skill gap, candidate ranking, comparison, recommendation roadmap.
5. Screens: assembled from documented components only.

## Naming

Use PascalCase for React components; use a variant prop rather than duplicate components. Component APIs must expose loading, disabled, error, and accessible-name behavior.

## Acceptance Criteria

- [ ] No screen hard-codes a non-token visual value without documented exception.
