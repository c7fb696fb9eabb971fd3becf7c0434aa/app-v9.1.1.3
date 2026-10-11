# Content Schema

The package defines version-1 page, card, attachment, and public-index records. Run-time validation is shared by the API, editor, and static content build.

## Storage

- Pages use `content/pages/<lowercase-uuid>.json`.
- Cards use `content/cards/<lowercase-uuid>.json`.
- Repository-hosted assets use `content/media/<lowercase-uuid>.<mime-derived-extension>`.
- IDs are immutable and independent of titles, slugs, parent relationships, and sibling order.
- Child pages point to parents by ID. Slugs are normalized lowercase path segments and unique among siblings.
- The public index includes the full source commit SHA so readers and editor drafts can identify the content snapshot.
- `createContentIndex` validates and deterministically orders records before producing an index without changing source arrays.

## Initial Bounds

The version-1 policy supports JPEG/PNG/WebP images, MPEG/OGG/WAV audio, MP4/WebM video, PDF, and HTTPS/HTTP links. Repository assets are capped at 10 MiB each, cards at 20 attachments, page/card ordering values at 1,000,000, publish batches at 500 mutations, and JSON publish bodies at 28 MiB. These are conservative initial repository limits, centralized in `CONTENT_LIMITS`; revisit them before production staging based on the actual media set and repository budget.

## Validation

`ContentRecordsSchema` checks duplicate IDs, sibling slug collisions, missing parents/pages, hierarchy cycles, attachment shape, MIME type, and asset size. `buildPageTree` validates before producing a deterministic order by explicit order, slug, and stable ID. Storage paths are derived only from validated IDs, never from user-provided filenames or titles.

## Schema evolution

Version 1 records must be migrated explicitly before their `schemaVersion` changes. A migration reads and validates the old records, transforms them into the new version, validates the complete relationship graph, and publishes the transformed records atomically in one Git commit. Do not reinterpret old records silently at read time. The public index is generated from a single commit snapshot and carries that source commit SHA; consumers can reject an unsupported schema version rather than rendering partially migrated content.
