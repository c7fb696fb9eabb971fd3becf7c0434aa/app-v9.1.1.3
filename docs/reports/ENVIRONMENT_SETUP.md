# Environment Setup

## Local Prerequisites

- Windows 10/11 with PowerShell 7 recommended.
- Git for Windows; configure the user's own `user.name` and GitHub-associated `user.email` locally.
- Node.js 24.21.0 LTS.
- Corepack-enabled pnpm 12.11.2.
- VS Code with ESLint, Prettier, Tailwind CSS IntelliSense, and GitHub Actions extensions.

## Initial Setup (after the fresh project scaffold exists)

```powershell
node --version
corepack enable
corepack prepare pnpm@12.11.2 --activate
pnpm --version
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The reports-only reset intentionally has no `package.json` yet, so dependency installation/build commands become valid only after implementation starts.

## Configuration and Secrets

- `.env.example` contains names and non-secret local defaults only; commit it.
- `.env.local`, `.env.*.local`, private keys, PATs, session-signing keys, and encryption keys are ignored by Git.
- `apps/web` may expose only public configuration such as `VITE_API_BASE_URL`; anything prefixed `VITE_` is shipped to browsers.
- `apps/api` secrets are configured in Cloud Run Secret Manager and read at runtime. Never pass them as Docker build args or write them to build logs.
- PAT entry is user input at runtime. Validate it at the API, store it server-side encrypted with expiry, and redact authorization headers in logs.
- Validate environment variables at API startup with a schema. Fail fast on missing/invalid production config; never silently fall back to a baked-in token or repository.

## Project Configuration

- Root `package.json`: private pnpm workspace, pinned `packageManager`, Node engine range, scripts.
- `pnpm-workspace.yaml`: `apps/*` and `packages/*`.
- `tsconfig.base.json`: strict compiler options, no implicit `any`, path aliases, consistent module resolution.
- `.editorconfig`: UTF-8, LF, final newline, two-space indentation.
- ESLint flat config + Prettier; CI runs lint, formatting check, typecheck, tests, schema validation, and build.
- `.gitignore`: dependencies, outputs, local env files, IDE caches, temporary uploads, coverage, test reports.
- VS Code `.vscode/launch.json` and `tasks.json`: launch web and API concurrently, attach debugger, run checks, and debug tests.

## CI and Deployment

CI uses Node 24.21.0, pnpm 12.11.2, and frozen lockfile installation. Pull requests run all static and behavior checks. Main-branch commits build the public Vite bundle and deploy it to GitHub Pages; API deployment is a separate workflow with protected environment approvals and Cloud Run identity federation. Do not put the PAT in GitHub Actions unless a distinct automation credential is intentionally configured for a narrowly scoped workflow.
