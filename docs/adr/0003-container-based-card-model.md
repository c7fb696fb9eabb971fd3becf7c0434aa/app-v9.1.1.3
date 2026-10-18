# ADR 0003: Container-based card model

- Status: Accepted
- Date: 2026-10-17

## Context

The current v1 content model attaches cards directly to pages. That makes the backend tree's
selectable unit ambiguous: the editor and preview need a stable object that groups a set of
swappable cards, including when the set is empty. The desired hierarchy is:

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

Introduce content schema v2 with explicit page, container, and card records:

- Pages retain stable IDs, parent-page relationships, and page ordering.
- Containers have stable IDs, an owning page ID, a title, and page-local ordering.
- Cards retain their stable IDs and content fields, but reference a container ID instead of a page
  ID. Card identity, tag, text, and attachments remain card-owned.
- A card container with no cards is valid.
- Record identity is based on IDs, never titles or carousel positions.
- The backend editor will keep unsaved drafts associated with their record IDs. Preview selection
  must keep the editor's active-card context synchronized.
- Preview and published/deployed routes should share content resolution and card rendering
  semantics.

Schema v2 is additive. The repository reader, backend tree, and public renderer accept validated
v1 and v2 snapshots. V1 pages/cards are projected onto UI-only virtual containers; v2 containers
are loaded from their persisted records. The v1 projection is not persisted, and no migration or
repository write is performed as part of normal reads.

## Migration

The explicit v1-to-v2 conversion creates one container titled `Cards` for each legacy page,
including pages with no cards. It preserves page and card IDs and order, assigns each converted
card to the container for its former page, and requires a caller-provided ID generator for new
container IDs. The conversion is pure and validates both its legacy input and v2 result. It does
not write to GitHub or alter repository files.

The generated container IDs must be persisted as part of an explicitly reviewed migration before
any future write path relies on them. Invalid legacy data, invalid or colliding generated IDs, or
an invalid converted hierarchy fail explicitly; the application must not silently invent a
fallback hierarchy during normal reads.

The read-only migration planner requires an exact page-to-container ID mapping and a source commit
SHA. It produces a deterministic, path-sorted list of replacement page/card files, added container
files, and a `content/manifest.json` schema marker, with serialized v2 records and a count summary.
The manifest keeps an empty repository distinguishable as v2 after the last page is removed. The
plan is bound to the source commit so a future migration applier can reject a stale plan. Creating a plan
performs no GitHub request or write; apply/rollback behavior requires a separate review and explicit
authorization.

## Consequences

- The tree can select a container independently from its cards.
- Empty, single-card, and multi-card previews have an unambiguous selection unit.
- The shared resolver orders cards by explicit order with stable ID tie-breaking for both v2
  records and the v1 virtual-container projection. Backend and public pages share its selection
  rules and carousel controls; empty and one-card containers do not show indicators.
- Card content remains isolated by stable card ID, which allows per-record drafts when switching
  carousel slides.
- The backend currently loads validated v1 or v2 repository snapshots. V1 pages receive UI-only
  virtual containers; v2 containers retain their persisted IDs. The adapter is not a migration,
  and tree/editor changes remain page-memory drafts that are not persisted.
- Existing v1 repository content remains readable until a separately tested migration is applied.
- The v2 backend writer validates the complete resulting content, checks the expected head both
  before object creation and immediately before ref update, creates one tree and commit, and updates
  the branch without force. It writes a v2 manifest so an empty repository retains its schema.
  A stale head fails explicitly; the app does not silently retry or overwrite another writer. The
  schema itself does not prevent concurrent Git edits.
- The backend does not publish schema-v1 drafts. A separately reviewed migration must be applied
  before legacy v1 content is editable through persistent saves.

## Verification

The v2 schema and conversion are tested for valid empty pages/containers, missing parents, missing
containers, duplicate IDs, invalid IDs, and preservation of legacy page/card identity and card
order. Shared preview resolution is tested for v2 records and virtual v1 containers, including
empty, single-card, and multi-card sets, active-card selection, stable ordering, and invalid
references. Backend and public carousel behavior have interaction tests. The repository client
validates both v1 and v2 snapshots, rejects mixed-version and broken v2 relationships, and keeps
the v1 virtual-container projection read-only. The migration planner has deterministic-output,
mapping-completeness, collision, source-revision, and resulting-schema tests. Applying a migration
is outside this ADR's implementation. The v2 writer and backend save flow have mocked Git API
coverage for complete-tree publication, deleted-record entries, non-force updates, stale heads,
invalid data, preserved card fields, and local-draft retention after conflicts. No production
repository write is performed by these tests.
