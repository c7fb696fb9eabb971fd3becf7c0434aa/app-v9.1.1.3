# TODO 06: Content Schemas and Git Storage Contract

**Status:** DONE  
**Depends on:** TODO 02, TODO 05

## Goal

Define versioned, runtime-validated Git records that support an editable hierarchy without directory-name semantics.

## Work

- Define Page, Card, Attachment, and ContentIndex schemas with immutable IDs and explicit schema version.
- Keep title, slug, parent ID, order, and physical storage path independent. Define slug normalization and sibling uniqueness.
- Define card content fields (title, tag, definition, key rule, code/spec fields) and typed attachment metadata.
- Use ID-addressed JSON records (`content/pages/<id>.json`, `content/cards/<id>.json`) and ID-addressed assets; document collision, rename, move, delete, and migration rules.
- Validate parent references, cycles, duplicates, missing attachments, supported MIME types, size limits, and content bounds.
- Define public generated index format and schema migration strategy.

## Done When

- Schemas and examples are committed with tests for valid/invalid records.
- A rename or reorder does not require renaming files or altering IDs.
- Tree can be reconstructed deterministically from records alone.

## Verification

Run schema property/fixture tests, duplicate/cycle/path traversal rejection tests, and deterministic build tests across differing file enumeration order.

**Evidence:** `packages/content-schema/src/index.ts` defines versioned Page, Card, Attachment, ContentIndex schemas, centralized MIME/content/order/publish bounds, ID-derived paths, complete parent/card/slug validation, `buildPageTree`, and deterministic `createContentIndex`. `packages/content-schema/README.md` documents storage, limits, and explicit atomic schema migration policy. The schema test suite passes valid/invalid references, path traversal, cycles, deterministic hierarchy/index order, asset bounds, and source commit validation.
