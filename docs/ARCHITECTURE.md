# GreenDocs System Architecture

This is the current-state map, checked against the workspace on 2026-10-12. It supersedes older
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
   renders page hierarchy, cards, and attachments. Loading and request errors are visible.
5. `src/pages/BackendPage.tsx` renders the protected, independently styled `/backend`
   route. Its header has Back to home, GitHub Sync, and Deployments controls around a centered
   Backend heading; the route does not read repository data or provide an authoring/publishing
   workflow. It composes shared header, frame, panel, dialog, toolbar, and card components, with
   route copy and toolbar action definitions supplied separately. Its two-panel visual scaffold
   and overlay boundaries are mapped in the
   [Backend Workspace Visual Map](./BACKEND_WORKSPACE_MAP.md).
6. `src/features/github/client.ts` reads the fixed branch/ref, commit, recursive tree, and
   validated record blobs. It also retains a tested batch `publish` library operation; no
   user-facing page currently calls it.
7. GitHub repository history is authoritative for committed content. The `/backend` route has no
   draft state or publishing behavior.

## Component and package ownership

| Boundary                    | Owns                                                                                              | Important entry points                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| App composition and routes  | Hash routing, public/protected routes, lazy route loading, route-level error UI                   | `src/app/App.tsx`, `AppRoutes.tsx`, `ProtectedRoute.tsx` |
| Authentication              | GitHub identity/permission checks, tab-scoped PAT, constrained authenticated requests             | `src/features/auth/AuthContext.tsx`                      |
| GitHub repository client    | Fixed-repository snapshot reads, record validation, asset validation, mutation commits            | `src/features/github/client.ts`                          |
| Navigation                  | Header, independent left/right drawers, auth-aware navigation                                     | `src/features/navigation/`                               |
| Backend route composition   | Protected independent header/workspace composition and overlay selection; no authoring UI        | `src/pages/BackendPage.tsx`                              |
| Shared UI                   | Buttons, inputs, workspace layouts, dialogs, card previews, toolbars, status, tabs, icon catalog | `src/components/`                                        |
| Shared contracts            | Browser-safe record and publish-request TypeScript interfaces, runtime configuration and policies | `packages/contracts/`                                             |
| Content schema              | Zod record/relationship validation, limits, storage paths, deterministic page trees               | `packages/content-schema/src/index.ts`                            |
| Build/runtime configuration | Fixed repo/API target, Pages base path, local port                                                | `config.ts`, `vite.config.ts`                                    |
| Quality gates               | Module-boundary and known-secret checks; formatter, linter, typecheck, tests, build               | `scripts/`, root `package.json`, `.github/workflows/ci.yml`       |
| Deployment                  | Static Pages artifact built from the web workspace                                                | `.github/workflows/deploy-pages.yml`                              |

Web features expose public `index.ts` barrels; cross-feature imports must use those barrels.
`scripts/check-module-boundaries.mjs` checks browser/server boundaries, workspace package imports,
feature internals, and cycles. It retains server-boundary checks for possible future server code;
that does not mean an API app currently exists.

## Content and persistence

- Page, card, attachment, and publish contracts live in `packages/contracts/index.d.ts`.
- Runtime validation, schema version, stable-ID storage paths, allowed MIME types, content limits,
  and hierarchy invariants live in `packages/content-schema/`.
- The configured Git repository and `main` branch are centralized in `config.ts`.
- Repository JSON is stored at `content/pages/<uuid>.json` and `content/cards/<uuid>.json`;
  attachments refer to media under `content/media/<uuid>.<mime-derived-extension>`.
- IDs, validated records, and explicit parent relationships define identity and hierarchy. Titles
  and slugs are not file paths.
- No user-facing editor, draft persistence, or publish workflow is implemented. The repository
  client publish primitive is currently a library capability tested independently of the UI.

See the [content schema guide](../packages/content-schema/README.md), [cache policy](./CACHE_POLICY.md),
and [ADR 0001](./adr/0001-system-architecture.md) for domain details and rationale.

## Trust boundaries and invariants

- Never ask an owner to send a PAT in chat. The user enters it in the application sign-in UI.
- Never log, bundle, or place credentials in URLs, tests, docs, or command arguments. The PAT is
  deliberately stored in tab-scoped `sessionStorage` to survive refresh; it remains readable by
  JavaScript and is not protected from XSS or developer tools.
- Do not accept caller-selected repository owner/name/branch or arbitrary Git paths.
- Treat every repository record as untrusted until runtime schema validation succeeds.
- The repository client's publish primitive validates the resulting complete content set, requires
  the expected branch head, and updates the ref without force. No current UI invokes it.
- Do not test repository writes or deploy to production without explicit approval of the exact
  operation.
- A successful commit, green CI run, and successful Pages deployment are separate outcomes.

The full security rationale and residual XSS/supply-chain risk are in [ADR 0002](./adr/0002-pat-auth-and-session-security.md)
and [Project Access](../AGENTIC/PROJECT_ACCESS.md).

## Verification map

- Route, sign-in, and protected-home behavior: `src/app/AppRoutes.test.tsx`.
- Protected backend route, independent header, and workspace scaffold:
  `src/pages/BackendPage.test.tsx`. For the current visual structure, see the
  [Backend Workspace Visual Map](./BACKEND_WORKSPACE_MAP.md).
- GitHub snapshot and publish behavior: `src/features/github/client.test.ts`.
- Content invariants and stable ordering: `packages/content-schema/src/index.test.ts`.
- Shared UI accessibility behaviors: `src/components/*.test.tsx`.
- Workspace-wide commands and CI gate order: [Operations](./OPERATIONS.md).
