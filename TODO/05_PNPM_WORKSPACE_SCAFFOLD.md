# TODO 05: Reproducible pnpm Workspace Scaffold

**Status:** IN PROGRESS
**Depends on:** TODO 02 and the local-tooling portion of TODO 04

## Goal

Create the empty, reproducible multi-app TypeScript workspace with current pinned tools, lint/test/debug entry points, and no product feature code.

## Work

- Create `apps/web`, `apps/api`, `packages/contracts`, `packages/content-schema`, and test fixtures as described in `docs/reports/FILE_STRUCTURE.md`.
- Pin Node 24 LTS and pnpm using `.nvmrc`/`.node-version`, root `engines`, `packageManager`, `pnpm-workspace.yaml`, and committed `pnpm-lock.yaml`.
- Pin compatible stable React/React DOM, TypeScript, Vite, Tailwind v4, and lint/test/type packages; use `pnpm install --frozen-lockfile` in CI.
- Add strict shared TypeScript config, Oxc linting, Prettier, EditorConfig, `.gitignore`, and scripts for lint, format check, typecheck, unit test, integration test, and build. Use the TypeScript compiler for typechecking; the current typescript-eslint parser release does not support TypeScript 7 yet.
- Add VS Code launch/tasks for web/API/debug/test workflows.
- Add CI for pull requests, with no deploy on arbitrary branches.
- Use `corepack pnpm@12.11.2` for local project commands until the WinGet pnpm 12.8.1 PATH precedence is repaired.
- Local scaffold must not silently substitute fake auth or a local secret fallback while Cloud Run is unavailable.

## Done When

- Fresh clone setup works from documented commands on Windows and CI.
- All scripts run successfully on a minimal scaffold.
- No secret, generated output, or ignored local file is committed.

## Verification

The local scaffold implementation and gates are in place. Current verification: `corepack pnpm@12.11.2 lint`, `typecheck`, `test`, and `build` pass. `format:check` is not clean in seven files: `apps/api/src/app.ts`, `apps/api/src/github/repository.test.ts`, `apps/api/src/github/repository.ts`, `packages/content-schema/src/index.test.ts`, `packages/content-schema/src/index.ts`, `packages/content-schema/tsconfig.json`, and `packages/content-schema/vitest.config.ts`. CI is configured for exact pnpm 12.11.2 and frozen lockfile installation. VS Code launch/task definitions exist for web/API/debug/test workflows.

**Remaining:** Verify setup from a clean clone, observe hosted GitHub Actions CI, and launch/attach the VS Code debugger. Those checks cannot run against the current workspace state because the scaffold changes are uncommitted. Cloud deployment remains TODO 04/14.

**Evidence:** Workspace lint, typecheck, tests, and build pass locally. Hosted CI and a clean-clone run are not claimed.
