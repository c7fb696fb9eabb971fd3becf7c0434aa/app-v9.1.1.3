# TODO 05: Reproducible pnpm Workspace Scaffold

**Status:** IN PROGRESS
**Depends on:** TODO 02 and the local-tooling portion of TODO 04

## Goal

Create the empty, reproducible multi-app TypeScript workspace with current pinned tools, lint/test/debug entry points, and no product feature code.

## Work

- Create `apps/web`, `packages/contracts`, and `packages/content-schema` as described in `docs/reports/FILE_STRUCTURE.md`.
- Pin Node 24 LTS and pnpm using `.nvmrc`/`.node-version`, root `engines`, `packageManager`, `pnpm-workspace.yaml`, and committed `pnpm-lock.yaml`.
- Pin compatible stable React/React DOM, TypeScript, Vite, Tailwind v4, and lint/test/type packages; use `pnpm install --frozen-lockfile` in CI.
- Add strict shared TypeScript config, Oxc linting, Prettier, EditorConfig, `.gitignore`, and scripts for lint, format check, typecheck, unit test, integration test, and build. Use the TypeScript compiler for typechecking; the current typescript-eslint parser release does not support TypeScript 7 yet.
- Add VS Code launch/tasks for web/test workflows.
- Add CI for pull requests, with no deploy on arbitrary branches.
- Use `corepack pnpm@12.11.2` for local project commands until the WinGet pnpm 12.8.1 PATH precedence is repaired.
- The app must not substitute fake auth or introduce an external runtime.

## Done When

- Fresh clone setup works from documented commands on Windows and CI.
- All scripts run successfully on a minimal scaffold.
- No secret, generated output, or ignored local file is committed.

## Verification

The local scaffold and checks are in place. Hosted CI and Pages deployment have passed for the previously deployed commit. The architecture now has no app API package; GitHub is contacted directly by the browser.

**Remaining:** Verify setup from a clean clone and launch the VS Code web debugger.

**Evidence:** Workspace lint, typecheck, tests, and build pass locally. Hosted CI and a clean-clone run are not claimed.
