# Visual Process

## Source of Truth

Preserve `docs/COLOR_SYSTEM.md` unchanged. It is the only design-system artifact retained from the old application. This report translates its intent into implementation guidance; it does not authorize bringing old UI code forward.

## Visual Tokens

- Canvas: near-black/obsidian (`#05080c` / `#070a0e`); elevated glass surfaces use `#070a0e` at about 90% opacity.
- Primary accent: emerald 500 (`#10b981`); bright interaction/focus accent: emerald 400 (`#34d399`).
- Standard white border alpha: 0.08; subtle dividers: 0.06; muted outer strokes: 0.04.
- Active state: emerald surface at about 0.15 alpha and border at about 0.30 alpha. Hover border: emerald at about 0.40 alpha.
- Text hierarchy: slate/white for primary reading, restrained slate/zinc for support, emerald for focus/state. Use monospace for paths, IDs, sequence markers, and code; sans-serif for longer prose.
- Atmosphere: quiet dot-matrix texture and restrained top emerald illumination. Keep texture behind content and non-interactive.

## UI Application

- Use semantic design tokens in CSS variables; components must not copy raw color values throughout JSX.
- Cards and controls use the documented border, opacity, and focus treatment. Hover is not the only indication of action; keyboard focus and disabled states must be visible.
- Maintain the compact technical look, but make information hierarchy, contrast, and touch targets readable at mobile widths.
- Hierarchy tree: dense, scannable rows with visible parent/child indentation, selected state, and explicit actions. Avoid an expanding nesting of decorative cards.
- Editor: sections for target page, card content, attachments, preview, and publish review. Keep publish separate from save-to-draft.
- Modals/dialogs: clear title, focus management, Escape handling, visible close control, and no nested-card visual framing.
- Use icons consistently for icon-only actions and provide accessible labels/tooltips; text labels remain for destructive or high-impact commands.

## Verification

Capture screenshots at 1440x900, 1024x768, and 390x844. Check color token use, focus visibility, contrast, long names, tree indentation, media states, modal boundaries, and overflow. Test keyboard-only navigation and reduced-motion preference before accepting visual work.
