# ADR 0001: GreenDocs System Architecture

**Status:** Proposed baseline for implementation  
**Date:** 2026-10-10  
**Owners:** Product owner and implementation team

## Context

The public app must remain on the supplied GitHub Pages URL, while authorized users must edit content and commit it to the supplied repository. GitHub Pages is static hosting and cannot keep a PAT secret or safely perform privileged GitHub writes. The UI needs independent public and Studio routes, ID-based data rather than filename-driven hierarchy, and an auditable commit/deploy path.

## Decision

1. `apps/web` is a React/Vite static SPA deployed to GitHub Pages. Hash routing preserves the required repository subpath URL.
2. `apps/api` is a TypeScript Node service deployed to Cloud Run. It is the only runtime component permitted to call GitHub write APIs.
3. Git is the durable source of truth. Pages, cards, and attachment metadata are versioned JSON records addressed by stable IDs. The web build generates a public read index from a commit snapshot.
4. `content/pages/<id>.json`, `content/cards/<id>.json`, and an initially bounded `content/media/` area are the proposed layout. Titles/slugs never become identity or trusted paths.
5. The API uses GitHub Git Database operations to write all validated batch changes as one commit. The commit parent must equal the branch head observed for the draft; ref update is non-force. A moved head returns a conflict.
6. Secret Studio is a separate lazy route reached by direct URL only. It does not appear in the public right drawer. The server independently enforces authentication and repo permission; route secrecy is not authorization.
7. PAT is exchanged for a short-lived opaque session. The API retains a short-lived encrypted PAT/session record in Firestore with TTL, encrypted via Cloud KMS; the browser retains only the opaque session in memory. Reload requires reauthentication. This avoids cross-site cookies between `github.io` and `run.app`.
8. Public immutable assets can be cached by content hash. Authenticated API responses use `Cache-Control: no-store`. The application does not persist drafts, content, or credentials in localStorage, IndexedDB, or Cache API. Browser/Pages CDN caching of public static assets cannot be fully disabled or controlled by a client-side app.
9. `main` pushes run content/schema validation, tests, web build, Pages deploy, and separate API release steps. CI uses workload identity federation, not long-lived cloud keys.

## Module Ownership and Dependencies

| Module | Owner and public surface | Allowed dependencies | Prohibited dependencies |
|---|---|---|---|
| `apps/web/src/app` | App shell, providers, route composition, protected-route gate | Page entrypoints and feature public barrels | Feature private files, API server source |
| `apps/web/src/pages` | Route-level public home, login, and Studio page views | App contracts and feature public barrels | GitHub adapter, storage details, other page internals |
| `apps/web/src/features/auth` | Volatile browser auth state; `index.ts` is the public API | Shared contracts and browser APIs | API implementation, browser persistence, other feature internals |
| `apps/web/src/features/navigation` | Header and right-side navigation; `index.ts` is the public API | Auth public API and app route config | Auth private files, API implementation |
| `apps/web/src/app/styles.css` | Current shared design tokens and primitives | CSS platform | Product state and server modules |
| `apps/web/src/test` | Shared test cleanup and environment setup | Test framework | Production modules |
| `apps/api/src` | API composition, runtime config, and server entry | Shared contracts and server-only capabilities | Web source and browser state |
| `packages/contracts` | Shared request/response types, endpoint and local runtime constants | Platform types only | Any app implementation |
| `packages/content-schema` | Reserved owner for validated content records (TODO 06) | Shared contracts and schema library | App and API implementations |

Browser features expose only deliberate barrels. The boundary checker at `scripts/check-module-boundaries.mjs` parses TypeScript/TSX imports, rejects web-to-server dependencies and direct cross-feature implementation imports, and reports cycles in the local app graph. `lint` and `test` run that check in CI.

The GitHub adapter, page/card/assets, publishing, design-system component library, and route-level lazy-loading modules are future capabilities; they are not claimed to exist in this scaffold. Their owners and allowed dependencies are defined by the dependent TODOs before implementation.

## Consequences

- Adds Cloud Run, Firestore TTL storage, and Cloud KMS configuration to the delivery surface; TODO 04 must verify access/quota/cost before implementing the session store.
- PATs remain server-side; API outages prevent authoring but do not prevent reading the last deployed static site.
- Public reading is commit-snapshot-based; Studio obtains live drafts from the API.
- API/auth framework selection and media storage thresholds remain explicit TODO 06/08 decisions; do not invent them in components.
- Existing Pages deployment workflow was removed during the repository reset and must be recreated before the next production site update.

## Alternatives Rejected

- PAT in Vite env, browser storage, source, or commit: leaks a repo-write credential.
- Browser-to-GitHub write calls: exposes PAT and duplicates authorization logic.
- Filename/directory names as record identity: couples hierarchy changes to paths and creates naming conflicts.
- Hidden Studio link as security: direct URLs remain reachable; enforce server authorization.
- Force-push or per-file commits: risks overwrite and partially applies page/card/asset batches.
