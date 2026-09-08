# PeerSphere Design System — Glass × Clay × Minimalist

One deliberate hybrid, not three competing styles. Preview every primitive at
`/dev/design` (development builds only).

## The three-way split

| Layer | Governs | Look |
|---|---|---|
| **Minimalist** | Layout & content | Generous whitespace, 2–3 type sizes per screen, ONE accent color, opaque `--ps-surface` for data/content, no decorative clutter |
| **Glassmorphism** | *Overlay / elevated* surfaces | Translucent bg + backdrop-blur + thin light border + soft shadow (`styles/glass.css`) |
| **Claymorphism** | *Interactive / tactile* elements | Soft inflated shape, dual-tone shadow (light top inset, dark bottom inset + drop), large radius, no harsh edges (`styles/clay.css`) |

## Decision table — which surface does an element get?

| Element | Surface | Component / class |
|---|---|---|
| Primary action (one per screen) | Clay accent | `<ClayButton>` |
| Tactile secondary action, toggle, segmented choice | Clay neutral | `<ClayButton variant="neutral">` |
| Badge, skill tag, priority chip | Clay chip | `<ClayChip>` / `.clay-chip` |
| Nav bar, sidebar, bottom nav | Glass nav | `.glass-nav` |
| Modal, sheet, dropdown, menu | Glass overlay | `<GlassDialog>` / `.glass-overlay` |
| Card floating over content, feature card | Glass | `<GlassCard>` |
| Control chrome inside glass (tabs, search, filter) | Glass ctrl | `<GlassButton variant="glass">`, `<GlassTabs>`, `<GlassInput>` |
| Low-emphasis action | Flat | `<GlassButton variant="secondary" / "ghost">` |
| Data tables, page content, form bodies | Opaque minimal | `--ps-surface` + `--ps-border` |
| Destructive action | Flat danger | `<GlassButton variant="danger">` |

## Clay token inventory (`styles/tokens.css`)

| Token | Consumed by | Purpose |
|---|---|---|
| `--ps-clay-radius` / `--ps-clay-radius-chip` | `.clay` / `.clay-chip` | inflated corners / pill |
| `--ps-clay-bg`, `--ps-clay-text` | `.clay`, `.clay-chip` | neutral clay surface |
| `--ps-clay-shadow` | `.clay`, `.clay-chip` | resting dual-tone shadow |
| `--ps-clay-shadow-pressed` | `.clay-interactive:active` | pressed inset |
| `--ps-clay-accent-bg`, `--ps-clay-accent-text` | `.clay-accent` | primary-action fill |
| `--ps-clay-accent-shadow(-pressed)` | `.clay-accent` | accent-hued dual-tone shadows |

All clay tokens are defined for light and dark in all four theme blocks
(`:root`, media dark, `[data-theme="dark"]`, `[data-theme="light"]`).

## Anti-patterns (hard rules)

1. **No glass-on-glass stacking deeper than 2** — a glass dialog may contain glass controls; nothing glass inside those.
2. **No clay for static content** — clay implies "you can press this." Cards, tables, and text never get clay.
3. **One accent clay button per screen.** Two primary actions is zero primary actions.
4. **Max 2–3 type sizes per screen** (display + body + caption).
5. **Never color-only state** — match strong/partial/missing always pairs color with a label or icon.
6. **Components consume tokens, never raw values.**

## QA checklist {#qa}

Executed 2026-09-07 (build + computed contrast; visual rows verified on `/dev/design`):

| Check | Result |
|---|---|
| `npx tsc --noEmit` with preview page | ✅ 0 errors |
| Production build excludes `/dev/design` (404 via `notFound()`) | ✅ NODE_ENV gate |
| Contrast — light: text on clay bg | ✅ 16.63:1 |
| Contrast — light: white on accent clay (primary) | ✅ 5.20:1 |
| Contrast — light: muted text on surface | ✅ 4.88:1 |
| Contrast — dark: text on clay bg | ✅ 11.94:1 |
| Contrast — dark: inverse text on accent clay | ✅ 5.85:1 |
| Contrast — dark: muted text on surface | ✅ 5.34:1 |
| Axe scans (WCAG 2.0/2.1 AA): landing, student dashboard+jobs, admin dashboard+candidates | ✅ 0 critical/serious (e2e/accessibility.spec.ts, 2026-09-08) |
| GlassDialog keyboard: opens via button, Escape closes | ✅ automated |
| Contrast retune 2026-09-08: muted 42%, faint 44%, success 28%, warning 31%, danger 47%, badge text uses -dark shades, active nav accent-dark | ✅ all ≥4.5:1 computed |
| ClayButton: sm/md/lg, accent/neutral, disabled, loading render | ✅ on /dev/design |
| ClayButton keyboard focus ring visible on both surfaces | ✅ `--ps-focus-ring` composited over clay shadow |
| Pressed state uses inset shadow, respects `prefers-reduced-motion` | ✅ media query in clay.css |
| Glass fallback for `prefers-reduced-transparency` | ✅ existing glass.css block |
| Both themes via ThemeSwitcher on /dev/design | ✅ tokens defined in all 4 theme blocks |
