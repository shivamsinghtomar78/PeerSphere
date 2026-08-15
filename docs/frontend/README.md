# PeerSphere Frontend UI/UX Specification

## Purpose

This directory is the implementation contract for the PeerSphere web experience. It defines what users see and do; it does not define matching algorithms, backend implementation, or infrastructure.

## Required Technology Stack

| Layer | Decision |
|---|---|
| Application framework | **Next.js (App Router) with TypeScript** |
| UI runtime | React |
| Styling | Tailwind CSS, CSS variables, and modern CSS |
| Animation | Framer Motion or an equivalent, subject to reduced-motion support |
| Icons | Lucide React or one consistent accessible icon set |
| Validation/forms | TypeScript-first schemas and accessible form controls; library choice remains an implementation decision |
| Data charts | An accessible, TypeScript-compatible chart library selected during implementation |

Use server components by default for static/read-heavy UI. Add client components only where interaction, browser APIs, or local state requires them. Keep API calls behind typed frontend service modules; never duplicate matching, authorization, or eligibility logic in the browser.

## Design References

The visual principles are adapted—not copied—from [Liquid Glass Widgets](https://github.com/sdegenaar/liquid_glass_widgets) and [Apple Bento Grid](https://github.com/hubeiqiao/apple-bento-grid). The first informs selective control/navigation glass and accessibility-aware fallbacks; the second informs purposeful, compact information grouping. No Flutter/Dart code, Apple assets, or proprietary visual assets are used.

## Reading Order

1. Read design vision, principles, information architecture, and design system.
2. Read the relevant experience and screen specification before implementing a route.
3. Build from the component library; do not create one-off patterns.
4. Implement all states, responsiveness, accessibility, and performance safeguards.
5. Complete visual and interaction QA before claiming a screen is complete.

## Status

This is a planning specification. Its checklists are pending until the Next.js application and evidence-based tests exist.
