# TODO 05B: Typed Configuration and No Scattered Magic Values

**Status:** IN PROGRESS
**Depends on:** TODO 02, TODO 04, TODO 05

## Goal

Eliminate embedded deployment assumptions, secret literals, duplicate settings, and unexplained magic values from application behavior.

## Work

- Define typed schemas for public web config, GitHub repo/branch binding, routes, cache policy, asset limits, and pagination/order limits.
- Keep public values in one validated build/runtime config surface; never build credentials into the app.
- Fix repository identity in the browser client; do not accept caller-supplied owner/repo/branch.
- Centralize route IDs, limits, supported attachment MIME/extensions, GitHub API paths, feature flags, and timeout/retry policy.
- Add startup validation that fails on missing or invalid config; prohibit silent production fallbacks.
- Add lint/secret scanning for embedded tokens, owner/repo literals outside config, duplicate magic values, and unregistered route strings.

## Done When

- Deployment config and example values are documented without secrets.
- Repository, Pages base path, size cap, and route path have typed sources of truth.
- Secret scanning proves no credential is in source, web output, reports, or test fixtures.

## Verification

Earlier typed configuration included API ports, CORS, and server binding. Those are obsolete after adopting the GitHub-only, client-direct architecture. Remaining configuration fixes the Pages base path, repository, and branch; GitHub API requests are fixed to `api.github.com`. Tests cover supported and invalid configuration. The secret scanner reports filenames/rule names only. Current workspace checks must be rerun after the architecture migration.

**Remaining:** Reverify typed config and secret scanning after the current architecture refactor.

**Evidence:** `apps/web/config.ts`, `packages/contracts/runtime-config.js`, and corresponding config tests.
