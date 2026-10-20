---
description: Repository-specific guidance for GreenDocs editor, backend workspace, preview, and content-model work.
applyTo: 'src/**/*.{ts,tsx}'
---

# GreenDocs content-model and editor rules

Use this guidance when working on the GreenDocs documentation workspace, backend editor, preview UI, or content resolution logic.

## Core content model

The canonical hierarchy is:

Page -> nested page -> card container -> card

Treat the container as a first-class selectable record. A page may contain multiple containers, and a container may contain zero, one, or many cards. Empty containers are valid and must render an explicit empty state with no carousel indicators.

## Single source of truth

The editor and preview must derive their state from shared selection state instead of independent local copies. Keep a single model such as:

- selectedTreeNodeId
- selectedContainerId
- activeCardId
- draftByRecordId

The preview should never silently own a different active-card state than the editor. If the selected container changes, the resolved preview must update; if the active card changes in the carousel, the editor must switch to that card by stable ID.

## Selection and sync rules

- Selecting a container loads that container into the preview even if it has zero cards.
- A one-card container should render the card without carousel indicators.
- A multi-card container should render a carousel with indicators and an active card.
- Editing must operate on stable record IDs, not titles, slugs, or position alone.
- Switching cards must preserve draft state and never silently discard edits for a different record.

## Preview vs published rendering

The backend workspace preview and the public/published view must both use the same content-resolution logic. Do not create separate ad hoc preview rules for the editor that diverge from the public rendering path.

The backend preview is also the visual contract for published content. Reuse its page/container summary and card-preview presentation on the public view, including card fields, attachments, carousel, toolbar, and notes. Keep page, nested-page, container, and card boundaries visible in the published hierarchy; do not replace previewed cards with a simplified article layout.

## Verification gate before live repo work

Do not advance to real GitHub repository verification until:

- the auth and route flow is passing its tests,
- the relevant Vitest suite is green,
- the app is validated against the content model and editor state transitions locally.

A correct content architecture is not enough if the auth or route shell is still failing. Live repository verification must happen only after the project is in a passing state.

## Example policy

If a user selects a container with multiple cards, the preview resolves the container and active card by container ID and card ID. The left panel reads the active card by ID, and the right panel renders the same resolved card. If the user swaps cards in the preview, the editor updates to the same record ID. Do not rebind edits to a different card by title or index.
