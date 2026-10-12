---
name: documentation-maintenance
description: 'Use when adding, reorganizing, auditing, or updating GreenDocs project documentation, onboarding, architecture maps, scope/status statements, operational guides, or ADR indexes.'
---

# GreenDocs Documentation Maintenance

## Purpose

Maintain the repository's documentation as concise, navigable shared project memory. This is a
workflow, not an independent source of project truth.

## Procedure

1. Read `AGENTIC/README.md` and `docs/README.md`; then read only the canonical docs relevant to the
   proposed change.
2. Inspect the code, tests, manifests, workflows, and current tracker needed to verify any claimed
   behavior, tool, owner, priority, or release status.
3. Choose the existing canonical source:
   - Product purpose, audience, constraints, and shipped capability:
     `docs/PRODUCT_BRIEF.md`.
   - Current system map, component responsibilities, boundaries, and data flow:
     `docs/ARCHITECTURE.md`.
   - Setup, verification, release, deployment, support, and security procedures:
     `docs/OPERATIONS.md`.
   - Durable decision rationale: a dated, sequential ADR under `docs/adr/`.
   - Domain behavior: the relevant existing schema, UI, cache, color, or access guide.
4. Add a new document only when it has a distinct audience or durable purpose. Add it to
   `docs/README.md` and link it from onboarding if it is required for first-run.
5. Remove contradictions in directly related legacy docs or label dated reports as snapshots.
   Prefer links to canonical sources over copied facts.
6. Preserve uncertainty explicitly. Never infer product priority, implementation status, or named
   owner from absence. Check the issue tracker and date any live observation.
7. Verify local Markdown links with `corepack pnpm@12.11.2 lint`; review the diff for duplicate,
   stale, or unsupported claims.

## Output

Report canonical files changed, evidence sources used, unresolved truth/ownership gaps, and the
exact validation result. Do not commit or publish unless explicitly authorized.
