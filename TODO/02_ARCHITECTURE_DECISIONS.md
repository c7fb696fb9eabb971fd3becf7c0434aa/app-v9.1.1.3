# TODO 02: Architecture and Decision Records

**Status:** DONE  
**Depends on:** TODO 01

## Goal

Review and record the technical design before implementation, including constraints imposed by GitHub Pages and cross-origin API hosting.

## Accepted Baseline (ADR 0001)

- Static web app on GitHub Pages; API on Cloud Run; fixed allowed repository/owner/branch.
- Hash routes to support the requested `.../app-v9.1.1.3/#/` public URL without server rewrite rules.
- Git repository as authoritative persistence for page/card/media metadata; static generated index as public read model.
- Server-side GitHub API adapter uses Git object APIs for a single atomic commit per publish batch and expected-head conflict detection; never force-push.
- PAT exchange/session design, including browser memory lifetime, API origin, CORS, cookie feasibility, CSRF, session expiry, revocation, and scale-out storage.
- Page/card records keyed by stable IDs; parent IDs and independent slugs/orders; no title-derived file paths.
- Asset storage/size threshold and treatment of large media.
- CI and separate Pages/API deployment boundaries.

The binding architecture decision, alternatives, and consequences are recorded in [ADR 0001](../docs/adr/0001-system-architecture.md). The product owner authorized implementation of this architecture. Cloud resource availability is tracked independently in TODO 04.

## Done When

- Short ADRs document context, decision, alternatives, security implications, and consequences.
- Architecture identifies every trust boundary, data authority, deployment environment, and failure recovery path.
- Product owner approves the ADRs before scaffold work starts.

## Verification

Evidence: [ADR 0001](../docs/adr/0001-system-architecture.md) records where PATs, sessions, content, assets, drafts, and commit state live, and how concurrent edits and deployment failures are handled.
