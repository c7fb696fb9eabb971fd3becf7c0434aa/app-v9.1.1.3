# GreenDocs

Git-backed documentation authoring and publishing workspace. GitHub is the sole identity provider, content store, source-control host, and deployment platform.

## Workspace

- `apps/web`: Vite/React public site and protected Studio UI, deployed to GitHub Pages.
- `packages/contracts`: shared record and publish contracts.
- `packages/content-schema`: page/card/asset validation and storage-path rules.
- `TODO/`: implementation backlog and acceptance checks.

## Local Commands

Use the project-pinned package manager with Corepack:

```powershell
corepack pnpm@12.11.2 install
corepack pnpm@12.11.2 dev
corepack pnpm@12.11.2 lint
corepack pnpm@12.11.2 typecheck
corepack pnpm@12.11.2 test
corepack pnpm@12.11.2 build
```

The browser verifies the user by calling GitHub's `/user` API with the PAT, checks push permission on the fixed repository, and uses the token for GitHub Git Database API reads and atomic commits. The token is held only in the active tab's memory; it is not persisted and is cleared on sign-out, API rejection, or tab close. Reloading requires signing in again.

**Security trade-off:** this GitHub-only design necessarily exposes the entered PAT to JavaScript running in the page while signed in. Any XSS or compromised dependency could act with that token's GitHub permissions. Use a dedicated token with the least available repository scope, do not use an account-wide token unnecessarily, sign out after editing, and revoke the token in GitHub if it may be compromised. GitHub Pages cannot provide a server-side secret boundary.

## Deployment

Pushes to `main` run CI and deploy `apps/web` to GitHub Pages through `.github/workflows/deploy-pages.yml`. There is no separate API service, Cloud project, external database, or API-origin setting.

## Route Flow

- `/#/` is the public landing page before sign-in.
- Successful GitHub sign-in always redirects to `/#/home`.
- `/#/home` displays the repository's pages, nested sub-pages, and cards.
- Authenticated users visiting `/` are redirected to `/home`; the header home control also points to `/home`.
- `/#/studio` is a protected developer-only route. It is intentionally not linked in the landing page, documentation home, header, or drawer; developers enter it manually.
- Signed-out visits to `/home` or `/studio` return to `/`.
