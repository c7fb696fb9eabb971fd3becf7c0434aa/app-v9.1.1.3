# ADR 0003: Container-based card model

- Status: Accepted
- Date: 2026-10-17

## Context

The original content model attached cards directly to pages, making the selectable unit
ambiguous. The editor and preview need a stable object that groups swappable cards, including
when the set is empty. The canonical hierarchy is:

```text
Page
├── Card container
│   └── Cards
└── Nested page
    └── Card container
        └── Cards
```

A page may have multiple named card containers. Nested pages are pages with a parent page; they
use the same container/card relationship as root pages. A page or container may be empty. New
pages should receive a default container in the editing workflow, but the data model does not
require a page to have one.

## Decision

Use content schema v2 with explicit page, container, and card records:

- Pages retain stable IDs, parent-page relationships, and page ordering.
- Containers have stable IDs, an owning page ID, a title, and page-local ordering.
- Cards retain their stable IDs and content fields, but reference a container ID instead of a page
  ID. Card identity, tag, text, and attachments remain card-owned.
- A card container with no cards is valid.
- Record identity is based on IDs, never titles or carousel positions.
- The backend editor keeps unsaved drafts associated with their record IDs. Preview selection
  keeps the editor's active-card context synchronized.
- Preview and published/deployed routes share content resolution and card rendering semantics.
- Attachment edits stay on the owning card. Stored files use repository media blobs; remote media
  URLs retain an explicit media kind and MIME type, while generic external URLs remain a separate
  link kind.

Schema v2 is the only supported content model. The repository reader, backend tree, and public
renderer accept validated v2 records; legacy v1 records are rejected instead of projected into
virtual containers. There is no migration planner or migration UI. A repository with no content
records is treated as an empty workspace so it can be populated directly. Its first successful
save writes the v2 manifest with the content; any repository containing records must have a valid
v2 manifest. This makes the active schema explicit as soon as content is published without
requiring an empty-repository setup flow.

## Consequences

- The tree can select a container independently from its cards.
- Empty, single-card, and multi-card previews have an unambiguous selection unit.
- The shared resolver orders cards by explicit order with stable ID tie-breaking for persisted v2
  records. Backend and public pages share its selection rules and carousel controls; empty and
  one-card containers do not show indicators.
- Card content remains isolated by stable card ID, which allows per-record drafts when switching
  carousel slides.
- The backend attachment carousel supports file upload and direct HTTPS media URLs. Uploaded media
  blobs and card metadata are committed in the same validated, expected-head-checked tree; public
  and backend previews share the same format-aware renderer.
- The backend loads only validated v2 repository snapshots. Containers always have persisted IDs,
  and tree/editor changes remain page-memory drafts until saved.
- Legacy v1 records are not read or converted by the app. Repositories with existing legacy data
  must be converted outside the application before use.
- The v2 backend writer validates the complete resulting content, checks the expected head both
  before object creation and immediately before ref update, creates one tree and commit, and updates
  the branch without force. A stale head fails explicitly; the app does not silently retry or
  overwrite another writer. The schema itself does not prevent concurrent Git edits.

## Verification

The v2 schema is tested for valid empty pages/containers, missing parents, missing containers,
duplicate IDs, invalid IDs, and attachment validation. Shared preview resolution is tested for
empty, single-card, and multi-card containers, active-card selection, stable ordering, and invalid
references. Backend and public carousel behavior have interaction tests. The repository client
requires a v2 manifest whenever content records exist, treats a repository with no content records
as an empty workspace, rejects legacy records, and validates v2 relationships. The v2 writer and
backend save flow have mocked Git API coverage for complete-tree publication, deleted-record
entries, non-force updates, stale heads, invalid data, preserved card fields, and local-draft
retention after conflicts. No production repository write is performed by these tests.
