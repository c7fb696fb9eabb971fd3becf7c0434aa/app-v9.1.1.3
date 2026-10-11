# TODO 09: Visual System and Accessible UI Primitives

**Status:** IN PROGRESS  
**Depends on:** TODO 01, TODO 05

## Goal

Recreate the documented visual language in a new component system without copying old application code.

## Work

- Translate `docs/COLOR_SYSTEM.md` into semantic CSS variables for canvas, surfaces, borders, text, emerald accents, focus, and disabled states.
- Implement app shell, right drawer, route container, button variants, input, tabs, tree row, dialog, status banner, spinner, empty/error state, and typography utilities.
- Follow the visual process in `docs/reports/VISUAL_PROCESS.md`; define icon and tooltip conventions.
- Add keyboard navigation, focus-visible styling, screen-reader labels, reduced-motion behavior, and responsive dimensions.

## Done When

- Components consume tokens rather than scattered one-off colors.
- All controls work by keyboard and have visible focus/disabled states.
- UI primitives do not encode Git/storage logic.

## Verification

Visual snapshots at 1440x900, 1024x768, and 390x844; accessibility automation plus keyboard-only walkthrough; compare palette and treatment to retained COLOR_SYSTEM.md.

**Local evidence:** Semantic design tokens and shared accessible primitives (button, input, tabs, tree row, dialog, status, spinner, and empty state) are implemented; web interaction tests pass. Automated viewport snapshots and a full browser accessibility walkthrough have not been run, so visual sign-off remains open.
