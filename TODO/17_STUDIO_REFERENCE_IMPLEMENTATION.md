# TODO 17: Screenshot-Driven Studio Authoring Workspace

**Status:** IN PROGRESS
**Depends on:** TODO 06, TODO 07, TODO 11, TODO 12, TODO 13

## Goal

Replace the current page-tree-first editing screen with the supplied GUI Management Portal design. Studio should open directly into a focused card-authoring workspace; hierarchy selection, repository sync, and deployment management remain distinct actions.

## Reference Layout Contract

- Keep the protected, manually addressed Studio route and the existing top bar: `Go to /home`, centered `GUI Management Portal`, `GitHub Sync`, and `Deployments`.
- Use the available viewport as a two-column workspace. The left editor is for destination, card metadata/content, and attachments. The right pane is a live preview and diagnostics surface.
- Put page/folder destination selection behind an explicit `Select` action that opens the searchable page hierarchy. This selects a repository page ID; it is not a local filesystem or GitHub folder picker.
- Present card metadata as title, tag/badge, and sequence/order. Follow with definition/overview, execution rule/invariant, and TypeScript specification.
- Provide separate upload and external-reference controls for audio, PDF, and walkthrough video. Keep uploads within the existing type/size/attachment limits and store them using the repository asset model.
- Preview the actual current card draft, including tag, rule, specification/code, and valid attachment actions. Preview updates as the draft changes.
- Show diagnostics and consumer metadata (including the consumer hash) based on real draft and repository state.
- `Queue in Deployments` links to the deployment portal and must not publish content. `Commit & Push to GitHub` invokes the existing explicit atomic publish/review flow and never claims deployment success merely because the commit succeeded.
- Any toolbar control shown in the reference must have a defined, accessible behavior and a test; do not ship decorative or simulated actions.
- Preserve memory-only drafts, fixed repository/branch authority, safe PAT handling, and no Studio navigation in the global drawer.

## Subtasks

| ID  | Deliverable                                       | Depends on | Status      |
| --- | ------------------------------------------------- | ---------- | ----------- |
| 17A | Rebuild full-width two-column workspace shell     | TODO 06-13 | IN PROGRESS |
| 17B | Add destination page selector and empty-page flow | 17A        | IN PROGRESS |
| 17C | Align card metadata/content fields with schema    | 17A, 17B   | IN PROGRESS |
| 17D | Add dedicated media upload/reference controls     | 17C        | IN PROGRESS |
| 17E | Complete live preview, toolbar, and diagnostics   | 17C, 17D   | NOT STARTED |
| 17F | Wire queue/publish actions to real workflows      | 17C, 17D   | NOT STARTED |
| 17G | Verify screenshots, responsive/a11y, and flows    | 17B-17F    | NOT STARTED |

## Execution Rules

1. Keep the reference's information architecture; do not add permanent navigation/tree columns to the card-authoring screen.
2. Reuse `CardDraft`, `PageDraft`, the content schemas, shared content limits, and the existing GitHub repository client. Do not create a second persistence model.
3. Use a GitHub page record as a content destination; do not imply arbitrary folder binding when the repository contract stores cards by page ID.
4. Asset uploads and external URLs must map to supported stored-asset attachments or validated HTTP(S) links. Do not invent unsupported persisted media fields.
5. Preserve all editor state when opening/closing auxiliary dialogs. Require confirmation before an action discards drafts.
6. Do not write/publish to the production repository as part of visual or browser acceptance unless the user explicitly approves the exact content change.

## Acceptance

- Empty and populated repository screens both provide an obvious, functional path to create/select a destination and author a card.
- Screenshot layout is recognizable at desktop and remains usable on narrow screens and keyboard-only navigation.
- Field edits immediately update a preview rendered from the same draft that will be validated and published.
- Supported media controls, toolbar actions, diagnostics, queue, and publish each perform their named behavior with visible success/error states.
- Tests cover schema mapping, page selection, media limits and URLs, preview changes, toolbar interactions, publish handoff, and protection against accidental writes.

## Verification Evidence

- Baseline tests/build before this implementation: 23 web tests passed; typecheck, build, lint/security scans, and formatting passed for commit `0ec2dfb`.
- Current focused Studio verification: 4 workspace tests passed; workspace typecheck and web production build passed. Media inputs are category-specific, reject mismatched upload MIME categories, and validate external references as HTTP(S).
- No screenshot-driven browser acceptance has yet been completed against the new authoring layout.
