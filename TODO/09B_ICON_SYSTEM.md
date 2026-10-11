# TODO 09B: Unique and Governed Icon System

**Status:** IN PROGRESS  
**Depends on:** TODO 09, TODO 09A

## Goal

Give every action a distinct, semantically appropriate icon through one governed catalog; prevent copied inline SVGs, ambiguous glyphs, or one icon being reused for unrelated actions.

## Work

- Inventory actions and assign a unique semantic icon key (create page, add sub-page, edit, delete, reorder, attach audio/PDF/video, publish, conflict, status).
- Use one approved icon package/catalog and central typed icon registry; prefer established icons over hand-drawn duplicates.
- Define standard size/stroke/color and icon-only button wrapper with `aria-label`, tooltip, focus, disabled, and test contract.
- Allow decorative icons to be hidden from screen readers; destructive/high-impact actions retain visible text labels.
- Prohibit inline duplicated SVG and arbitrary Unicode as product icons outside documented exceptions.

## Done When

- Every icon-only control maps to a unique catalog key and accessible action name.
- Repeated semantic actions render consistently across routes.
- Missing/invalid icon keys fail lint/typecheck rather than silently rendering a fallback glyph.

## Verification

Render a complete icon gallery/story page and test icon-button labels, keyboard focus, disabled state, and contrast against all supported surfaces.

**Local evidence:** `apps/web/src/components/Icon.tsx` centralizes a typed Lucide registry with distinct icon mappings, defaults, and an accessible icon-button wrapper. Tests render every catalog entry and cover accessible naming, focus, activation, and disabled behavior; web tests pass.

**Remaining:** A persistent gallery/story page, contrast checks on every supported surface, and proof that all future icon-only controls use the catalog are not yet verified.
