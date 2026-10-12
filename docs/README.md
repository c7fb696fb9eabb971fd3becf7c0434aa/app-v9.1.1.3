# GreenDocs Documentation

This index is the documentation map. It identifies the authoritative current-state sources,
historical decisions, operational runbooks, and design contracts. Read only the sections relevant
to the task after completing the short agent warm-up in [`AGENTIC/README.md`](../AGENTIC/README.md).

## Start here

1. [Product brief](./PRODUCT_BRIEF.md) — problem, audience, product constraints, implemented
   capabilities, and where active priorities are maintained.
2. [System architecture](./ARCHITECTURE.md) — current system map, runtime flows, trust boundaries,
   module ownership, and implemented-versus-planned status.
3. [Operations guide](./OPERATIONS.md) — environment setup, checks, release, deployment, support,
   and security response.

## Current domain references

- [UI component contracts](./UI_COMPONENT_CONTRACTS.md) — component ownership, routes,
  accessibility, and UI behavior.
- [Color system](./COLOR_SYSTEM.md) — design tokens and visual interaction requirements.
- [Cache policy](./CACHE_POLICY.md) — cache and freshness expectations by data class.
- [Content schema README](../packages/content-schema/README.md) — content records, validation,
  storage paths, and schema evolution.
- [Project access and credential boundaries](../AGENTIC/PROJECT_ACCESS.md) — canonical repository
  wiring and safe authentication rules.

## Decisions and history

Architecture decisions are recorded chronologically in [`adr/`](./adr/). ADRs explain why a
decision was made; the current [System architecture](./ARCHITECTURE.md) remains the guide to what
is implemented now.

- [ADR 0001: GitHub-only architecture](./adr/0001-system-architecture.md) — accepted 2026-10-11.
- [ADR 0002: PAT authentication and session security](./adr/0002-pat-auth-and-session-security.md) —
  accepted with documented residual risk 2026-10-11.

## Reports and snapshots

[`reports/`](./reports/) contains operational notes and point-in-time reports, not competing
architecture or product sources of truth. Check each report's date and verify time-sensitive facts
against the manifests, workflows, and current architecture before relying on them.

## Maintenance and ownership

| Information                                 | Maintainer                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| Product brief, scope source, and this index | Repository maintainers                                                  |
| System architecture and ADR links           | Repository maintainers; update with behavior or boundary changes        |
| Operations and security procedures          | Repository maintainers; verify when toolchain or release wiring changes |
| UI and visual contracts                     | Repository maintainers; update with accepted UI changes                 |
| Content schema contract                     | Content-schema maintainers; update with schema or storage changes       |

The repository does not identify individual document owners. Until maintainers assign named owners,
the responsibility belongs to the maintainers collectively. Do not treat an agent persona or
conversation as the owner or canonical storage of project facts.

Update the canonical source when behavior changes, link to it rather than duplicating it, and keep
ADRs for durable decisions. The `docs:check-links` command validates local Markdown links as part
of lint and CI.
