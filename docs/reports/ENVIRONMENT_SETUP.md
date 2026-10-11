# Environment Setup

## Local Prerequisites

- Windows 10/11 with PowerShell 7 recommended.
- Git for Windows; configure the user's own `user.name` and GitHub-associated `user.email` locally.
- Node.js 24.21.0 LTS.
- Corepack-enabled pnpm 12.11.2.
- VS Code with Oxc/Oxlint, Prettier, Tailwind CSS IntelliSense, and GitHub Actions extensions.

## Initial Setup (after the fresh project scaffold exists)

```powershell
node --version
corepack enable
corepack prepare pnpm@12.11.2 --activate
corepack pnpm@12.11.2 --version
corepack pnpm@12.11.2 install --frozen-lockfile
corepack pnpm@12.11.2 lint
corepack pnpm@12.11.2 typecheck
corepack pnpm@12.11.2 test
corepack pnpm@12.11.2 build
```

On this Windows environment, a WinGet pnpm 12.8.1 executable precedes Corepack in PATH. Use the explicit `corepack pnpm@12.11.2` invocation until that PATH ordering is corrected.

## Configuration and Secrets

- `.env.example` contains names and non-secret local defaults only; commit it.
- `.env.local`, `.env.*.local`, private keys, PATs, session-signing keys, and encryption keys are ignored by Git.
- `apps/web` may expose only public configuration such as `VITE_API_BASE_URL`; anything prefixed `VITE_` is shipped to browsers.
- GitHub API calls use the shared 15-second request timeout and do not retry automatically. Publish retries must reuse the same idempotency key; repository writes are protected by expected-head conflict handling.
- `apps/api` secrets are configured in Cloud Run Secret Manager and read at runtime. Never pass them as Docker build args or write them to build logs.
- PAT entry is user input at runtime. Validate it at the API, store it server-side encrypted with expiry, and redact authorization headers in logs.
- Production authentication requires `GOOGLE_CLOUD_PROJECT`, a full `SESSION_KMS_KEY_NAME`, a configured Firestore session collection, and a confirmed edge rate-limit policy (`AUTH_EDGE_RATE_LIMITING_CONFIGURED=true`). Grant the Cloud Run service identity only Firestore access to the session/idempotency collections and KMS encrypt/decrypt permission on that key.
- Configure Firestore TTL on the `expiresAt` field for both `greendocs_sessions` and `greendocs_publish_requests`. API-side expiry checks remain authoritative if TTL cleanup is delayed.
- The API defaults session lifetime to 900 seconds (bounded to 60–86,400 seconds). Do not set the production rate-limit confirmation until the Cloud Armor or equivalent policy has been deployed and verified.
- Validate environment variables at API startup with a schema. Fail fast on missing/invalid production config; never silently fall back to a baked-in token or repository.

## Project Configuration

- Root `package.json`: private pnpm workspace, pinned `packageManager`, Node engine range, scripts.
- `pnpm-workspace.yaml`: `apps/*` and `packages/*`.
- `tsconfig.base.json`: strict compiler options, no implicit `any`, path aliases, consistent module resolution.
- `.editorconfig`: UTF-8, LF, final newline, two-space indentation.
- Oxlint for TypeScript/JavaScript linting, `tsc` for typechecking, and Prettier for source/config formatting. The current `typescript-eslint` parser release has a TypeScript `<6.1.0` peer range and is incompatible with the pinned TypeScript 7.0.2.
- `.gitignore`: dependencies, outputs, local env files, IDE caches, temporary uploads, coverage, test reports.
- VS Code `.vscode/launch.json` and `tasks.json`: launch web and API concurrently, attach debugger, run checks, and debug tests.

## CI and Deployment

CI uses Node 24.21.0, pnpm 12.11.2, and frozen lockfile installation. Pull requests run all static and behavior checks. Main-branch commits run CI and build/deploy `apps/web` to GitHub Pages through `.github/workflows/deploy-pages.yml`. This workflow does not deploy the API; Cloud Run, Firestore, KMS, and CORS require separate secure provisioning. Set the repository Actions variable `VITE_API_BASE_URL` to the deployed API origin. Do not put the PAT in GitHub Actions unless a distinct automation credential is intentionally configured for a narrowly scoped workflow.
