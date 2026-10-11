# TODO 05B: Typed Configuration and No Scattered Magic Values

**Status:** IN PROGRESS
**Depends on:** TODO 02, TODO 04, TODO 05

## Goal

Eliminate embedded deployment assumptions, secret literals, duplicate settings, and unexplained magic values from application behavior.

## Work

- Define typed schemas for public web config, API runtime config, GitHub repo/branch binding, routes, cache policy, asset limits, and pagination/order limits.
- Keep public values in one validated build/runtime config surface; keep PAT/encryption/session secrets in server Secret Manager only.
- Keep fixed repository identity on the server; do not accept client-supplied owner/repo/branch as authority.
- Centralize route IDs, limits, supported attachment MIME/extensions, API paths, feature flags, and timeout/retry policy.
- Add startup validation that fails on missing or invalid config; prohibit silent production fallbacks.
- Add lint/secret scanning for embedded tokens, owner/repo literals outside config, duplicate magic values, and unregistered route strings.

## Done When

- Each deployment environment has a documented config schema and example values without secrets.
- Changing the repo base URL, API origin, size cap, or route path has one typed source of truth.
- Secret scanning proves no credential is in source, web output, reports, or test fixtures.

## Verification

Implemented typed validation for API ports, CORS origins, production HTTPS requirements, fixed server-side repository binding, web API origin, Pages base path, and local web/API ports. API paths, cache rules, GitHub timeout, schema bounds, and publish limits are shared contracts. Unit tests cover invalid ports, missing production origins, HTTPS enforcement, and Pages/API URL validation. The lint gate scans workspace text files, including generated web/API output, for known GitHub/AWS token and private-key patterns; it reports filenames/rule names only. Workspace test, lint, typecheck, and build pass locally.

**Remaining:** A production API origin and verified deployment bindings depend on TODO 04 cloud provisioning. No secrets are included in client config.

**Evidence:** `apps/api/src/config.ts`, `apps/web/config.ts`, `packages/contracts/api-paths.js`, `packages/contracts/runtime-config.js`, and corresponding config tests.
