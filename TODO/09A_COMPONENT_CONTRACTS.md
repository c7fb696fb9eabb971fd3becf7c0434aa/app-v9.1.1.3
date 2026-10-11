# TODO 09A: Reusable Component Contracts

**Status:** IN PROGRESS  
**Depends on:** TODO 05A, TODO 09

## Goal

Define reusable components through explicit identity, inputs, state, behavior, rendered output, persistence effects, and verification contracts.

## Contract Template

For every reusable component, document:

- **Identity:** stable component name, owning module, purpose, and whether it is public API or private implementation.
- **Attributes/properties:** typed props, required/optional/default values, valid combinations, and callbacks/events.
- **State:** controlled vs local state, lifecycle, reset rules, loading/error/empty/disabled states, and source of truth.
- **Behavior:** user interactions, keyboard behavior, focus behavior, async effects, and side effects.
- **Render output:** semantic HTML/ARIA roles, layout constraints, responsive behavior, and visual tokens used.
- **Committed view:** what the user sees after API commit/refresh, which differs from transient draft/preview.
- **Persistence boundary:** whether it may call a feature service; components do not write to GitHub or persistent browser storage directly.
- **Tests:** unit/accessibility/interaction cases required for the contract.

## Work

- Apply the template to buttons/icon buttons, inputs, dialog/drawer, navigation row, page tree node, card editor, attachment picker, preview, publish panel, status indicator, and route-level page shell.
- Establish composition rules and avoid a universal component with unrelated props/boolean modes.
- Define state ownership: URL for navigable location, feature state for drafts, API/Git for committed records, server session for authentication.

## Done When

- Each shared component has a concise contract and a focused test.
- Props and state have no undocumented hidden persistence or Git side effects.
- Component API changes can be reviewed independently from feature workflows.

## Verification

Contract tests verify defaults, callbacks, state transitions, accessible render output, and that transient draft changes do not appear as committed before publish.

**Local evidence:** `docs/UI_COMPONENT_CONTRACTS.md` documents shared primitive contracts and planned Studio component boundaries. Button/input/navigation/icon interactions are covered by focused web tests (14 passing). Contracts and tests for the not-yet-implemented editor, attachment, preview, and publish components remain for TODOs 11–13.
