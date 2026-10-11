# GreenDocs

Git-backed documentation authoring and publishing workspace. GitHub is the durable source of truth; the public site is a static build and the protected Studio is reached by direct URL after real GitHub PAT verification.

## Workspace

- `apps/web`: Vite/React public site and protected Studio UI (GitHub Pages).
- `apps/api`: Node/Hono API for GitHub verification and repository operations (Cloud Run).
- `packages/contracts`: shared API contracts.
- `packages/content-schema`: validated Git-backed page/card/asset records.
- `docs/COLOR_SYSTEM.md`: retained visual design source.
- `TODO/`: ordered implementation backlog and acceptance checks.

## Local Commands

Use the project-pinned package manager with Corepack, especially on this machine where a separate WinGet pnpm shim is earlier on PATH:

```powershell
corepack pnpm@12.11.2 install
corepack pnpm@12.11.2 dev
corepack pnpm@12.11.2 lint
corepack pnpm@12.11.2 typecheck
corepack pnpm@12.11.2 test
corepack pnpm@12.11.2 build
```

Cloud Run/Firestore/KMS credentials are not present in the current environment. Local development must fail clearly when required secure authentication providers are not configured; never replace real verification with fake login.

The API validates PAT identity and repository write access with GitHub before issuing a short-lived opaque session. Production sessions require Firestore and Cloud KMS configuration; the browser retains the session in memory only. Repository snapshot/publish requests are session-protected, uncached, bound to the configured repository, and publishes require an idempotency key.

## Deployment

Pushes to `main` run CI and independently build/deploy the web application to GitHub Pages using `.github/workflows/deploy-pages.yml`. The workflow deploys only `apps/web`; it does not deploy the API or configure its Cloud Run, Firestore, KMS, or CORS resources. Configure the repository Actions variable `VITE_API_BASE_URL` with the deployed API origin to enable browser-to-API requests. Until the API is deployed and securely configured, Studio authentication and publishing are unavailable on the hosted site.
