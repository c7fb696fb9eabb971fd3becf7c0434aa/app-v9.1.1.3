# ADR 0001: GitHub-Only GreenDocs Architecture

**Status:** Accepted
**Date:** 2026-10-11

## Context

GreenDocs must use GitHub for identity, repository data, source control, and hosting. GitHub Pages is static hosting and cannot keep a PAT secret or run an authenticated backend. Adding Cloud Run, Firestore, Cloud KMS, or another API provider violates the product constraint.

## Decision

1. `apps/web` is a React/Vite static SPA deployed to the supplied GitHub Pages URL. Hash routing supports the repository subpath.
2. GitHub is the only runtime identity/data service. The browser sends a user-entered PAT over HTTPS directly to `api.github.com`; no application API or proxy receives it.
3. Sign-in verifies `/user` and `permissions.push` for the fixed `c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3` repository. Successful sign-in always routes to protected `/home`.
4. The PAT is held in a closure-backed memory reference while the tab is open. It is not placed in React-rendered values, browser persistence, URLs, analytics, source, or build configuration. Sign-out and a GitHub 401 clear it. Reload requires reauthentication.
5. The browser reads the repository Git tree and validated records directly from GitHub. `/home` displays pages, sub-pages, and cards; page/card/media files are stored under stable-ID paths in the Git repository.
6. Publish validates the complete draft, checks the expected branch head, creates blobs/tree/commit, and advances the fixed branch with `force: false`. Concurrent branch updates fail rather than being overwritten. GitHub commit history is the audit and recovery record.
7. GitHub Actions runs CI and deploys the static app to GitHub Pages. The workflow uses GitHub's Pages artifact/deploy actions and does not deploy or call an external service.
8. Draft content and media bytes stay in tab memory until publish. Authenticated GitHub responses use `no-store`; public immutable assets and Pages bundles may be CDN-cached.
9. Route flow is fixed: signed-out `/#/` is the public landing page; successful sign-in lands at protected `/#/home`; `/home` displays repository pages/sub-pages/cards. Authenticated navigation to `/` redirects to `/home`. Studio is a protected direct URL `/#/studio`, intentionally absent from all navigation and entered manually by a developer. Signed-out protected routes return to `/`.

## Security Consequence

There is no server-side secret boundary in this architecture. While signed in, any script executing in the page can use the PAT. Restrict dependencies, avoid unsafe HTML, keep CSP restrictive, recommend least-privilege credentials, never persist or log credentials, clear them promptly, and clearly disclose the residual XSS/supply-chain risk. A PAT must never be embedded in the deployed bundle.

## Module Ownership

| Module                         | Responsibility                                                               |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `apps/web/src/features/auth`   | Verify GitHub identity/repository permission and hold the PAT in memory only |
| `apps/web/src/features/github` | Fixed-repository GitHub API reads and atomic Git commits                     |
| `apps/web/src/features/studio` | In-memory drafts, validation, review, and explicit publish                   |
| `packages/contracts`           | Shared record and publish types                                              |
| `packages/content-schema`      | Record validation and safe storage-path construction                         |
| `.github/workflows`            | CI and Pages deployment only                                                 |

Feature imports use public barrels. The browser must not depend on server code or accept client-selected repository targets.

## Alternatives Rejected

- External API/cloud/database: violates the GitHub-only requirement.
- PAT in a build variable, URL, source, localStorage, IndexedDB, or logs: leaks credentials.
- Fake OAuth identity or treating a public OAuth client ID as a secret: does not authenticate a user.
- Per-file commits or force-updated branch refs: permit partial writes or overwrite concurrent work.
- Hidden Studio route as authorization: the GitHub token and repository permission checks remain mandatory.
