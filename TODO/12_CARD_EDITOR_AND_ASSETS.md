# TODO 12: Card Editor, Media Attachments, and Preview

**Status:** IN PROGRESS  
**Depends on:** TODO 06, TODO 07, TODO 09, TODO 11

## Goal

Implement GUI authoring and modification of cards plus the real attachments represented by action buttons.

## Work

- Edit card identity/order/tag, definition, key rule, code/spec, and page association.
- Match the screenshot-driven authoring order: destination page selector; title, tag/badge, sequence order; definition/overview; execution rule/invariant; TypeScript specification.
- Add/remove/reorder typed attachments for audio, video, PDF, images, and external links.
- Validate supported file types, limits, URLs, and asset references; generate stable asset IDs.
- Preview actual card state and media actions. Each visible action must perform its stated behavior; remove simulation/filler actions.
- Put the actual card draft preview and its diagnostics next to the authoring form in the two-column Studio workspace; implement TODO 17 before calling UI acceptance complete.
- Track draft/base commit and display dirty/invalid/conflict state.
- Include asset writes/deletes in the same content commit batch as the card.

## Done When

- Create and edit card state survives round trips to Git and re-renders on public site after deploy.
- Attachment buttons reflect actual supported media, not empty placeholder modals.
- Invalid/oversize files fail before publish with actionable messages.

## Verification

Test card fields, media upload/link validation, replacement/removal, keyboard controls, mobile editor layout, and commit/reload consistency with fixture assets.

**Implemented locally:** Studio supports card creation/editing, page reassignment, fields for title/tag/definition/key rule/code/spec, card ordering/deletion, external HTTP(S) links, and typed image/audio/video/PDF attachments. It enforces the shared content-policy limits, including the 10 MiB maximum and supported MIME types, before staging; includes asset operations in the publish batch; previews staged media from in-memory bytes; and previews committed media from the configured public GitHub repository.

**Not verified:** Authenticated commit/reload and deployed public rendering require configured auth/cloud infrastructure and an isolated staging repository. Browser file upload/media playback and full mobile/accessibility acceptance have not been performed.

**Screenshot-driven gaps:** The current workspace is page-tree-first and does not yet match the target composer. TODO 17 tracks the destination selector, dedicated media references, preview toolbar, consumer diagnostics, and authoring layout as explicit acceptance work.
