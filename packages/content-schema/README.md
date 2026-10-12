# Content Schema

This workspace package owns runtime validation and storage-path rules for GreenDocs page, card,
attachment, and public-index records. The current web app uses it when reading repository records
and validating proposed repository mutations. There is no current production editor UI or separate
API application.

## Storage contract

- Pages use `content/pages/<lowercase-uuid>.json`.
- Cards use `content/cards/<lowercase-uuid>.json`.
- Repository-hosted assets use `content/media/<lowercase-uuid>.<mime-derived-extension>`.
- IDs are immutable and independent of titles, slugs, parent relationships, and sibling order.
- Child pages point to parents by ID. Slugs are normalized lowercase path segments and unique among
  siblings.
- Content indexes, when produced, carry the full source commit SHA identifying the snapshot.

## Validation and limits

`ContentRecordsSchema` checks duplicate IDs, sibling slug collisions, missing parents/pages,
hierarchy cycles, attachment shape, MIME type, and asset size. `buildPageTree` validates before
producing deterministic order by explicit order, slug, and stable ID. Paths are derived from
validated IDs, never from user-provided filenames or titles.

Limits and supported MIME types are defined in `packages/contracts/content-policy.js` and
re-exported by this package. The current limits include 10 MiB per asset, 20 attachments per card,
500 mutations per publish batch, and a 28 MiB publish request.

## Schema evolution

Version 1 records must be explicitly migrated before changing `schemaVersion`. A migration reads
and validates old records, transforms them, validates the complete relationship graph, and
publishes the result atomically in one Git commit. Do not silently reinterpret old records at read
time. Consumers should reject unsupported schema versions rather than render partial migrations.
