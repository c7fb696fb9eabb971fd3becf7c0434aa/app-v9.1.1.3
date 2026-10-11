# TODO 02: Architecture and Decision Records

**Status:** DONE
**Depends on:** TODO 01

## Accepted Baseline

- React/Vite SPA on GitHub Pages, with hash routes for the repository subpath.
- GitHub API is the only runtime auth/data service; no app backend or external infrastructure.
- PAT login validates GitHub `/user` and target repository push permission. Token remains in memory only, with the browser/XSS trade-off disclosed.
- The web client uses GitHub Git Database endpoints to create one expected-head, non-force commit.
- Git repository is authoritative for stable-ID page/card/media records; drafts are transient.
- GitHub Actions validates the workspace and deploys the Pages artifact.

The accepted decisions and consequences are documented in [ADR 0001](../docs/adr/0001-system-architecture.md) and [ADR 0002](../docs/adr/0002-pat-auth-and-session-security.md).

## Done When

- The product boundary, trust boundaries, auth/data path, publish behavior, deployment, and residual risk are documented.
- Architecture matches the user's GitHub-only constraint.
