# TODO 17: Independent, Screenshot-Accurate Studio Workspace

**Status:** IN PROGRESS
**Depends on:** TODO 06, TODO 07, TODO 11, TODO 12, TODO 13

## Goal

Rebuild Studio to match the supplied GUI Management Portal reference and the user's latest live-page review. Studio is an independent, focused authoring surface: it owns card/page draft editing and communicates with the separate Deployments page only through the established workflow handoff. The pushed implementation is partial and has **not** passed visual acceptance; do not treat its tests/build or current TODO progress as proof that the design is complete.

## Explicit Live-Review Findings

- The live page still displayed shared `.site-header` chrome (brand/home mark and global navigation control) and a `.studio-repository` strip; these do not belong in the clean Studio authoring layout.
- Current elements are misaligned and overflow or become awkward at constrained widths; the overall page does not match the supplied composition.
- Visible text or iconography that appears interactive must be a real, accessible button/link with a working action and clear state. Do not render button-like labels as inert text or ship decorative toolbar controls.
- The `Select` and GitHub sync popups are not complete user workflows; their trigger controls alone do not satisfy the requirement.
- The live result is not accepted as finished. A successful build, unit test, commit, push, or deployment is not visual/design acceptance.

## Required Studio Surface Contract

- Studio is a protected, manually addressed route. It must not show the shared application header, brand/home mark, global drawer/menu control, or the repository/base-commit/dirty-status strip in the authoring layout.
- Keep the Studio canvas visually independent and uncluttered. Do not add a permanent hierarchy/tree column, repository summary bar, deployment dashboard/status panel, or redundant application navigation.
- Do not show the `.studio-home-link` or a direct Deployments navigation button in the Studio header. Keep only intentional authoring controls (including destination selection and GitHub sync) and communicate with Deployments through the defined behind-the-scenes handoff.
- Match the approved Studio reference: aligned authoring and preview columns, consistent form/control sizing and spacing, clear section hierarchy, and the actual card preview treatment. At narrow widths, reflow without horizontal overflow, clipped controls, or unusably compressed columns.
- All actionable controls must have visible button/link affordances, labels, keyboard operation, focus states, disabled/loading states where applicable, and observable outcomes. Text labels alone must not masquerade as controls.
- The hierarchy selector and GitHub sync are dedicated, complete dialogs/popups launched from intentional controls. Dialogs need meaningful content, loading/empty/error/success states, keyboard and focus management, close/cancel behavior, and preservation of unsaved draft state.
- Studio may read the fixed repository and author/publish drafts using the existing GitHub-only contracts. Do not collect, expose, persist, or log PATs from these dialogs.
- Deployment execution/status belongs to the separate Deployments page. Studio communicates with it only through the defined queue/workflow handoff; do not embed a duplicate deployment dashboard or imply that queueing is a publish or deployment.

## Subtasks

| ID  | Deliverable                                              | Depends on | Status      |
| --- | -------------------------------------------------------- | ---------- | ----------- |
| 17A | Remove shared chrome and rebuild the aligned canvas      | TODO 06-13 | IN PROGRESS |
| 17B | Complete the destination-selection dialog and flow       | 17A        | IN PROGRESS |
| 17C | Align the card composer and responsive form controls     | 17A, 17B   | IN PROGRESS |
| 17D | Complete typed media upload/reference controls           | 17C        | IN PROGRESS |
| 17E | Match real preview, toolbar, and diagnostics behavior    | 17C, 17D   | NOT STARTED |
| 17F | Complete GitHub sync dialog and deployment handoff       | 17A-17E    | IN PROGRESS |
| 17G | Pass live visual, responsive, accessibility, and flow QA | 17A-17F    | NOT STARTED |

### 17A — Independent Layout and Alignment

- Remove the shared `.site-header` from the Studio route, including the brand/home mark and global drawer trigger; Studio must not merely hide the header contents while reserving its layout space.
- Remove `.studio-repository` from the authoring canvas, including repository/branch/base-commit/unsaved-status presentation there. Repository authority remains in application logic and can be presented in the GitHub sync dialog when useful.
- Remove `.studio-home-link`, direct Deployments navigation, and any duplicate or redundant navigation/control row identified by the reference review; do not reintroduce a permanent hierarchy explorer or deployment area. Keep only purpose-specific controls needed to author and sync.
- Match the reference's usable viewport, column proportions, section spacing, aligned labels/inputs, and preview card composition. Avoid elements positioned by brittle fixed widths/heights.
- Define and verify desktop, tablet, and narrow-phone behavior, including browser zoom and long labels/content. No horizontal page scrolling at supported widths.

### 17B — Destination Picker Dialog

- The destination field and `Select` button must be consistently aligned, sized, and keyboard accessible.
- Open a real dialog containing searchable repository pages/hierarchy, selection feedback, and explicit select/cancel/close actions. Loading, empty repository, no-results, and read failures have distinct states.
- Provide a useful create-page path when there is no destination or the user needs one; keep all operations staged in memory until the existing review/publish flow.
- Select stable page IDs (not arbitrary folders); restore focus on close and preserve card edits across open/search/select/cancel.

### 17C — Card Composer and Responsive Controls

- Match the reference order and hierarchy for title, tag/badge, sequence order, definition/overview, execution rule/invariant, and TypeScript specification.
- Ensure labels, fields, helper text, errors, and action buttons line up; controls fill their intended grid cells and wrap/reflow deliberately rather than appearing as unstyled text.
- Keep schema mapping, validation, preview, and publish based on the same card draft; preserve unsaved changes when changing destination or opening dialogs.
- Verify all actions (save/stage, cancel, queue/handoff, review/publish as applicable) are actual styled controls and remain usable at narrow widths.

### 17D — Typed Media Controls

- Provide distinct, clearly grouped upload and external-reference actions for audio, PDF, and walkthrough video; retain supported image handling where required.
- Enforce shared file-size/MIME/count limits and HTTP(S)-only URL validation; surface failures adjacent to the relevant control and preserve the rest of the draft.
- List, preview, reorder, and remove attachments with real accessible controls. Do not use empty placeholder dialogs or simulated media actions.

### 17E — Live Preview, Toolbar, and Diagnostics

- Render the actual draft in the screenshot-matched card treatment, with definition, tag, rule, specification/code and attachment actions where present.
- Every preview toolbar item must be mapped to a meaningful implemented action, have an accessible name and state, and have a test. Remove any item that has no defined real behavior.
- Show diagnostics and consumer metadata only when computed from actual draft/repository state; no fabricated hash, status, or success indicator.
- Verify the preview updates immediately and remains legible without displacing or breaking the editor at supported viewport sizes.

### 17F — GitHub Sync Dialog and Deployment Handoff

- GitHub Sync opens a complete dialog with fixed repository/branch context, authenticated identity/permission state, a real connection check, and explicit loading/error/success feedback. It must not ask for or persist a PAT.
- Queueing communicates the intended draft/workflow with the separate Deployments page using the existing contract and does not publish. The Deployments page owns workflow/deployment status and actions.
- Keep actual GitHub writes behind the existing review and explicit atomic publish flow; show commit success separately from Actions/Pages deployment state.
- Do not display duplicate deployment dashboard/status UI inside Studio; clarify any necessary handoff affordance in the product interaction and test its behavior.

## Execution Rules

1. Complete the layout/dialog planning and acceptance criteria before beginning another implementation pass; do not call a partial implementation finished.
2. Reuse `CardDraft`, `PageDraft`, the content schemas, shared content limits, and existing GitHub repository client. Do not create a second persistence model.
3. Use a GitHub page record as a content destination; do not imply arbitrary folder binding when the repository contract stores cards by page ID.
4. Asset uploads and external URLs must map to supported stored-asset attachments or validated HTTP(S) links. Do not invent unsupported persisted media fields.
5. Preserve all editor state when opening/closing auxiliary dialogs. Require confirmation before an action discards drafts.
6. Keep deployment status/workflow ownership in Deployments and use the approved behind-the-scenes handoff; do not conflate queue, commit, and deploy.
7. Do not write/publish to the production repository as part of visual or browser acceptance unless the user explicitly approves the exact content change.

## Acceptance

- On the protected Studio route, the shared site header/global menu and repository status strip are absent, with no reserved blank space where they were removed.
- At reference desktop dimensions, Studio visually matches the user's supplied screenshot in overall placement, proportions, alignment, form hierarchy, preview/card composition, and useful visible actions.
- At tablet and phone widths and browser zoom, content reflows without page-level horizontal overflow, overlapping/misaligned fields, clipped dialogs, or inaccessible actions.
- Select and GitHub Sync each open complete, interactive, accessible dialogs with tested loading, success, error, empty/cancel, close, and draft-preservation behavior as applicable.
- All visible interactive text/icons correspond to working button/link controls; every toolbar affordance has a tested effect or is absent.
- Empty/populated repositories both permit destination creation/selection and card authoring; edits immediately update the actual preview.
- Media controls, diagnostics, queue handoff, review, and publish each have real behavior and truthful state/error feedback.
- Tests cover schema mapping, selection and dialog behavior, media limits/URLs, preview and toolbar changes, deployment handoff, responsive layout, keyboard/accessibility, and no accidental writes.
- Complete browser visual verification on the actual deployed commit before claiming acceptance. Compare the rendered page with the supplied reference at matching viewport dimensions; capture and review the result. A green test/build or a user viewing an older deployment is not a substitute.

## Verification Evidence

- Baseline tests/build before this implementation: 23 web tests passed; typecheck, build, lint/security scans, and formatting passed for commit `0ec2dfb`.
- Current focused Studio verification: 4 workspace tests passed; workspace typecheck and web production build passed. Media inputs are category-specific, reject mismatched upload MIME categories, and validate external references as HTTP(S).
- Live visual review after commit `e6bc269` found the delivered page materially mismatched the reference: shared site header/global navigation and repository strip were still visible; layout alignment/responsiveness were deficient; and Select/GitHub dialogs were incomplete. This review rejects visual acceptance.
- No screenshot-driven browser acceptance has passed. The above test/build evidence validates code health only, not reference fidelity or completeness.
