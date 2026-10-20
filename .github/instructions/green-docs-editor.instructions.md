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

The backend workspace preview exists so authors can inspect how pages, nested pages, and cards will look while editing. It is a visual reference, not a shared implementation or runtime dependency for the published view.

The published view must render and navigate independently. Reuse content schemas and shared data-resolution rules where appropriate, but do not import preview/editor components, editor state, carousel behavior, or toolbar configuration into the public view. Every page and nested page has its own URL; containers organize cards but do not add a URL segment. Cards should follow the agreed visual layout while using public-view components and behavior.

## Verification gate before live repo work

Do not advance to real GitHub repository verification until:

- the auth and route flow is passing its tests,
- the relevant Vitest suite is green,
- the app is validated against the content model and editor state transitions locally.

A correct content architecture is not enough if the auth or route shell is still failing. Live repository verification must happen only after the project is in a passing state.

## Example policy

If a user selects a container with multiple cards, the preview resolves the container and active card by container ID and card ID. The left panel reads the active card by ID, and the right panel renders the same resolved card. If the user swaps cards in the preview, the editor updates to the same record ID. Do not rebind edits to a different card by title or index.
