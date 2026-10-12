# Visual Process

## Source of Truth

Use `docs/COLOR_SYSTEM.md` as the source of truth for the current design tokens and background layers. Update it when an accepted design decision changes those specifications; do not bring old UI code forward.

## Visual Tokens

- Canvas: obsidian charcoal (`#070a0e`); elevated glass surfaces use `#070a0e` at about 90% opacity.
- Primary accent: emerald 500 (`#10b981`); bright interaction/focus accent: emerald 400 (`#34d399`).
- Standard white border alpha: 0.08; subtle dividers: 0.06; muted outer strokes: 0.04.
- Active state: emerald surface at about 0.15 alpha and border at about 0.30 alpha. The right-sidebar login action matches the navigation controls' obsidian surface, standard border, and text colors; it keeps its full-width layout and height with a 4px radius. Hover applies `--interaction-glass-tint` (`rgba(255, 255, 255, 0.06)`) across the entire button surface without changing border, text, width, height, or spacing.
- PAT login: retain the Obsidian Glass card; use 4px radii for the token field and full-width verify action. The verify action uses the obsidian login-button surface/border/text treatment. Use an accessible 33px icon-only eye/eye-off control for token visibility; omit the key badge and redundant token-storage paragraph.
- Login route: render in a dedicated full-viewport shell without the shared site header or app-content layout; center the card and a full-width secondary-style “Return to Home Page” button with its leading 33px obsidian arrow control matching the eye control, including white-glass tint on hover and keyboard focus. Keep login-specific markup and controls independent while consuming global color tokens.
- Future login methods: stack disabled, inert provider buttons under Verify using the global secondary obsidian button treatment. They must not navigate, authenticate, or show pop-ups until implemented.
- Text hierarchy: slate/white for primary reading, restrained slate/zinc for support, emerald for focus/state. Use monospace for paths, IDs, sequence markers, and code; sans-serif for longer prose.
- Atmosphere: a fixed 24px emerald dot matrix (`rgba(16, 185, 129, 0.38)` at 0.45 opacity) with a radial elliptical mask, above a centered top aurora glow (emerald 12% through 5% to transparent, 1000px by 380px, blurred 64px). Keep both layers non-interactive behind content on the `#070a0e` canvas.
- Both sidebar headers and footers use the same frosted Obsidian Glass surface (`rgba(7, 10, 14, 0.90)`), 12px blur, and standard 8% white divider.
- Header: sticky 56px frosted-glass surface (`rgba(7, 10, 14, 0.90)`, 12px blur, 8% white divider) with a centered max-1280px inner row. Keep a balanced 33px navigation control, 33px brand mark, and 33px navigation control. Use the same 33px control-size token for both sidebar close buttons. Reuse the same `NavigationBrandLink` and 33px brand-size token for all three home logos; it routes by auth state and closes a sidebar when clicked there. The left control opens the standalone left sidebar; the right control opens the independent auth-aware right sidebar. Both drawers share the documented geometry and visual tokens in `docs/COLOR_SYSTEM.md`, but have separate sidebar-specific components, state, overlay markup, and behavior.
- Authenticated Home: place a full-width 56px location bar immediately below the global header, matching its Obsidian Glass surface, 12px blur, and divider. Center a bordered horizontal breadcrumb track capped at 680px with 4px corners and responsive side gutters; it currently shows only “Home” and supports horizontal drag/scroll for future page, sub-page, and card locations.

## UI Application

- Use semantic design tokens in CSS variables; components must not copy raw color values throughout JSX.
- Cards and controls use the documented border, opacity, and focus treatment. Hover feedback is a soft white glass tint covering the whole button, not an edge highlight or emerald fill; keyboard focus and disabled states remain explicitly visible.
- Maintain the compact technical look, but make information hierarchy, contrast, and touch targets readable at mobile widths.
- Hierarchy tree: dense, scannable rows with visible parent/child indentation, selected state, and explicit actions. Avoid an expanding nesting of decorative cards.
- Editor: sections for target page, card content, attachments, preview, and publish review. Keep publish separate from save-to-draft.
- Modals/dialogs: clear title, focus management, Escape handling, visible close control, and no nested-card visual framing.
- Use icons consistently for icon-only actions and provide accessible labels/tooltips; text labels remain for destructive or high-impact commands.

## Verification

Capture screenshots at 1440x900, 1024x768, and 390x844. Check color token use, focus visibility, contrast, long names, tree indentation, media states, modal boundaries, and overflow. Test keyboard-only navigation and reduced-motion preference before accepting visual work.
