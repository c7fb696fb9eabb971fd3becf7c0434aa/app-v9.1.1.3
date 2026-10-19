# GreenDocs System Architecture

This is the current-state map, checked against the workspace on 2026-10-17. It supersedes older
proposed file maps when they disagree with the checked-in code. See the [Product Brief](./PRODUCT_BRIEF.md)
for goals and shipped-versus-planned product status, and the [ADRs](./README.md#decisions-and-history)
for decision rationale.

## System context

```text
Browser
  ├─ static HTML/JS/CSS ───────────────> GitHub Pages
  ├─ user-entered PAT, identity/access ─> GitHub REST API
  ├─ repository Git reads/writes ───────> configured GitHub repository
  └─ public attachment bytes ───────────> raw.githubusercontent.com

GitHub Actions: CI on pull requests and main pushes; Pages deployment on main pushes
```

There is no checked-in `apps/api`, application server, cloud runtime, or external content
database. The browser-to-GitHub trust boundary is security-sensitive because the SPA necessarily
holds the PAT in session storage and memory while authenticated; page JavaScript can read it.

## Runtime and data flow

1. `src/main.tsx` mounts `App`; `App` composes `AuthProvider` and the hash router.
2. `src/app/AppRoutes.tsx` owns route selection and lazy loading. `ProtectedRoute`
   protects `/home` and `/backend`; route error boundaries provide local render-failure recovery.
3. `src/features/auth/AuthContext.tsx` verifies GitHub `/user` and the fixed repository's
   push permission. The PAT is held in a React ref and tab-scoped `sessionStorage`; on reload the
   app revalidates it before restoring the signed-in state. Sign-out or a 401 clears it. Requests
   are restricted to the GitHub API origin and the configured repository path.
4. `src/pages/HomePage.tsx` asks the GitHub feature to read the repository snapshot, then
   renders page hierarchy with an independently selected carousel for each persisted schema-v2
   container. The active card's content and attachments render in that page. Loading and request
   errors are visible.
5. `src/pages/BackendPage.tsx` renders the protected, independently styled `/backend`
   route. It reads a validated schema-v2 repository snapshot through the GitHub client. Pages,
   containers, and cards are represented only by persisted records with stable IDs; no legacy
   virtual containers or migration UI are used. New pages receive a default container; cards can
   be created under a selected container. Items can be selected, renamed, reordered, and deleted
   locally. The editor saves the complete v2 snapshot as one atomic Git commit. Card drafts can edit
   title, tag, definition, key
   rule, code, specification, and per-card attachments. The attachment carousel supports local
   image/audio/video/PDF uploads and explicit typed media URLs, plus a separate generic external
   link kind. Uploaded files are previewed locally and published as validated media blobs in the
   same Git tree/commit as their card metadata. Backend and public previews share attachment
   rendering, so audio URLs render as audio controls rather than generic links. Unsaved drafts are
   discarded on refresh. Loading, empty, read, save, and stale-head conflict states are
   explicit. The
   page composes shared header, frame, panel, dialog, toolbar, and card components, with route copy
   and toolbar action definitions supplied separately. Its two-panel layout and overlay boundaries
   are mapped in the [Backend Workspace Visual Map](./BACKEND_WORKSPACE_MAP.md).
6. `src/features/github/client.ts` reads the fixed branch/ref, commit, recursive tree, and
   validated record blobs. Its v2 writer validates the complete result and any referenced pending
   media uploads, creates JSON and binary blobs, builds one Git tree and commit, rechecks the
   expected head, and advances the fixed branch without force.
7. GitHub repository history remains authoritative for committed content. Backend changes are
   persisted when the user saves a validated schema-v2 draft.

## Component and package ownership

| Boundary                    | Owns                                                                                             | Important entry points                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| App composition and routes  | Hash routing, public/protected routes, lazy route loading, route-level error UI                  | `src/app/App.tsx`, `AppRoutes.tsx`, `ProtectedRoute.tsx`    |
| Authentication              | GitHub identity/permission checks, tab-scoped PAT, constrained authenticated requests            | `src/features/auth/AuthContext.tsx`                         |
| GitHub repository client    | Fixed-repository snapshot reads, record validation, and atomic schema-v2 commits                 | `src/features/github/client.ts`                             |
| Navigation                  | Header, independent left/right drawers, auth-aware navigation                                    | `src/features/navigation/`                                  |
| Backend route composition   | Protected workspace and temporary mock tree interactions                                         | `src/pages/BackendPage.tsx`, `src/pages/BackendTree.tsx`    |
| Shared UI                   | Buttons, inputs, workspace layouts, dialogs, card previews, toolbars, status, tabs, icon catalog | `src/components/`                                           |
| Content model and schema    | Browser-safe record types, Zod validation, limits, and storage paths                             | `src/lib/content.ts`                                        |
| Build/runtime configuration | Fixed repo/API target, Pages base path, local port                                               | `config.ts`, `vite.config.ts`                               |
| Quality gates               | Module-boundary and known-secret checks; formatter, linter, typecheck, tests, build              | `scripts/`, root `package.json`, `.github/workflows/ci.yml` |
| Deployment                  | Static Pages artifact built from the web workspace                                               | `.github/workflows/deploy-pages.yml`                        |

Web features expose public `index.ts` barrels; cross-feature imports must use those barrels.
`scripts/check-module-boundaries.mjs` checks browser/server boundaries, workspace package imports,
feature internals, and cycles. It retains server-boundary checks for possible future server code;
that does not mean an API app currently exists.

## Content and persistence

- Page, card, and attachment types, runtime validation, schema version, stable-ID storage paths,
  allowed MIME types, content limits, and hierarchy invariants live in `src/lib/content.ts`.
- The GitHub reader, backend tree, and public renderer accept only validated schema-v2 snapshots.
  Legacy schema-v1 page/card records fail explicitly; there are no virtual-container adapters or
  in-app migration flows. A truly empty repository is treated as an empty v2 workspace; its first
  successful save creates the v2 manifest together with its content. See
  [ADR 0003](./adr/0003-container-based-card-model.md).
- `src/lib/content-resolution.ts` provides deterministic page-container ordering and shared
  container/card preview selection for persisted v2 containers. The backend and public home use
  the shared resolver and carousel controls.
- The configured Git repository and `main` branch are centralized in `config.ts`.
- Stored attachments use `content/media/<uuid>.<extension>`; remote media URLs must use HTTPS and
  preserve their selected media kind and supported MIME type in the card record. Remote URLs must
  be publicly reachable by readers; they are embedded directly rather than copied into GitHub.
  Generic external links remain a distinct attachment kind and may use HTTP or HTTPS. Existing
  schema-v2 records remain valid because the URL variants are additive.
- Repository JSON is stored at `content/pages/<uuid>.json`, `content/cards/<uuid>.json`, and
  `content/containers/<uuid>.json` for v2; `content/manifest.json` marks schema v2 even when all
  content records are removed.
  attachments refer to media under `content/media/<uuid>.<mime-derived-extension>`.
- V2 container records are read from `content/containers/<uuid>.json`. The backend writer also
  writes `content/manifest.json` with the complete validated v2 content set. Empty repositories
  without content records are accepted as empty workspaces; once records exist, a schema-v2
  manifest is required.
- IDs, validated records, and explicit parent relationships define identity and hierarchy. Titles
  and slugs are not file paths.
- The backend explorer and left-side editor read validated v2 snapshots. Containers always have
  persisted IDs. Unsaved fields and local tree edits are isolated in page memory until saved;
  refresh discards unsaved changes. Multi-card preview selection follows the active card; empty
  and single-card containers do not show carousel controls. The writer validates the entire
  snapshot, uses one Git tree and commit, rechecks the source head before a non-force ref update,
  and reports concurrent-head conflicts without silently retrying.
- The public home uses the same resolver and carousel controls for each persisted v2 container,
  with independent selection per container.

See the content model in [`src/lib/content.ts`](../src/lib/content.ts), [cache policy](./CACHE_POLICY.md),
and [ADR 0001](./adr/0001-system-architecture.md) for domain details and rationale.

## Trust boundaries and invariants

- Never ask an owner to send a PAT in chat. The user enters it in the application sign-in UI.
- Never log, bundle, or place credentials in URLs, tests, docs, or command arguments. The PAT is
  deliberately stored in tab-scoped `sessionStorage` to survive refresh; it remains readable by
  JavaScript and is not protected from XSS or developer tools.
- Do not accept caller-selected repository owner/name/branch or arbitrary Git paths.
- Treat every repository record as untrusted until runtime schema validation succeeds.
- Local tree edits do not mutate the repository until the user selects Save changes. The writer
  accepts only a complete validated schema-v2 content set, checks the expected branch head twice,
  and updates the ref without force. Legacy records are rejected; no conversion is performed.
- Do not test repository writes or deploy to production without explicit approval of the exact
  operation.
- A successful commit, green CI run, and successful Pages deployment are separate outcomes.

The full security rationale and residual XSS/supply-chain risk are in [ADR 0002](./adr/0002-pat-auth-and-session-security.md)
and [Project Access](../AGENTIC/PROJECT_ACCESS.md).

## Verification map

- Route, sign-in, and protected-home behavior: `src/app/AppRoutes.test.tsx`.
- Protected backend route and workspace tree interactions:
  `src/pages/BackendPage.test.tsx` and `src/pages/BackendTree.test.tsx`. For the current visual structure, see the
  [Backend Workspace Visual Map](./BACKEND_WORKSPACE_MAP.md).
- GitHub snapshot and atomic publish behavior: `src/features/github/client.test.ts`.
- Backend-to-schema-v2 serialization and save interaction:
  `src/pages/backendRepositoryContent.test.ts` and `src/pages/BackendPage.test.tsx`.
- Content invariants and stable ordering: `src/lib/content.ts`.
- Shared UI accessibility behaviors: `src/components/*.test.tsx`.
- Workspace-wide commands and CI gate order: [Operations](./OPERATIONS.md).
