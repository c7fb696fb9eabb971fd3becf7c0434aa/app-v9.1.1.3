# TODO 11: Git-Backed Hierarchy Explorer and Page CRUD

**Status:** IN PROGRESS  
**Depends on:** TODO 06, TODO 07, TODO 09, TODO 10

## Goal

Build the Studio tree over Git-backed IDs and provide create/edit/rename/move/reorder/delete for root pages and sub-pages.

## Work

- Load repository tree through API with current commit SHA and loading/error/empty states.
- Implement search, expand/collapse, page selection, create page/sub-page, title/slug edit, sibling order, parent move, and delete confirmation.
- Keep hierarchy management in the destination selector/explorer dialog; the default card-authoring surface must reserve its main columns for the editor and live preview as specified in TODO 17.
- Maintain stable IDs; enforce slug uniqueness and prevent cycles/moving a node into its descendant.
- Edit in a draft; show dirty/validated/stale states; do not write directly when clicking tree controls.
- Show affected descendants/assets for deletes and provide change summary before publish.

## Done When

- All page operations round-trip to schema-valid drafts and survive API reload after publish.
- The visual tree is reconstructed from parent IDs and order, independent of physical file paths.
- Conflicts preserve the user's draft and provide a reload/reconcile route.

## Verification

Component/API tests for empty root, deep nesting, create/rename/move/reorder/delete, duplicate slug, cycle rejection, concurrent update, and keyboard/tree accessibility.

**Implemented locally:** Studio fetches the authenticated repository snapshot and source commit; builds a nested tree with search and collapse controls; supports root/child creation, slug/title/description edits, parent moves, sibling reorder, and subtree deletion with impact counts. Drafts are memory-only and are reviewed before publishing. The server publish API remains the authoritative schema/relationship validator and expected-head guard.

**Not verified:** No authenticated GitHub snapshot or live publish round-trip has run because the local API has no managed auth provider configured. Conflict preservation is implemented in the UI but still needs a real staging race test; full tree keyboard and screen-reader acceptance remains outstanding.
