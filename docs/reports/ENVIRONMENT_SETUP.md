# Environment Setup

## Local Prerequisites

- Windows 10/11 with PowerShell 7 recommended.
- Git for Windows.
- Node.js 24.21.0.
- Corepack-enabled pnpm 12.11.2.
- VS Code with Oxc/Oxlint, Prettier, Tailwind CSS IntelliSense, and GitHub Actions extensions.

## Setup and Checks

```powershell
node --version
corepack pnpm@12.11.2 install --frozen-lockfile
corepack pnpm@12.11.2 dev
corepack pnpm@12.11.2 lint
corepack pnpm@12.11.2 typecheck
corepack pnpm@12.11.2 test
corepack pnpm@12.11.2 build
```

## GitHub-Only Runtime

- GitHub is the only identity provider and live repository API. No application API, Cloud Run, Firestore, KMS, or external database is used.
- Sign-in sends a user-entered PAT directly to GitHub over HTTPS. The app holds it in tab memory only and sends GitHub API calls only to `api.github.com`.
- The PAT is never stored in environment files, GitHub Actions variables/secrets, source, logs, URLs, localStorage, IndexedDB, or Cache API.
- The browser necessarily exposes the PAT to executing page scripts while signed in. This residual XSS/dependency risk is disclosed in the sign-in UI; users should minimize token scope and sign out promptly.
- `.env.example` contains only the local web port; the fixed GitHub target is centralized in typed app config.
- Drafts/media are memory-only until a GitHub commit. Git is authoritative.

## Project Configuration

- Root `package.json`: private pnpm workspace, pinned package manager, Node engine range, and project scripts.
- `pnpm-workspace.yaml`: `apps/*` and `packages/*`.
- `tsconfig.base.json`: strict compiler options and consistent module resolution.
- `.editorconfig`: UTF-8, LF, final newline, two-space indentation.
- Oxlint, TypeScript, and Prettier provide linting, typechecking, and formatting.
- `.gitignore`: dependencies, outputs, local env files, IDE caches, coverage, and test reports.
- VS Code tasks launch the web app and run checks; there is no API process to launch.

## CI and Pages

GitHub Actions runs frozen-lockfile CI on pull requests and `main`. Pushes to `main` build the schema package and web app, then deploy the Pages artifact. The workflow uses GitHub Pages permissions only and needs no external runtime secrets. Branch protection and Pages repository settings should be confirmed by the repository owner.
