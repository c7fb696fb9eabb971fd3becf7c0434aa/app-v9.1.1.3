# TODO 14: CI, Pages, and API Deployment

**Status:** NOT STARTED  
**Depends on:** TODO 04, TODO 05, TODO 06, TODO 13

## Goal

Restore automated delivery for the new app and API with branch protection, validation, and secretless CI identity.

## Work

- Add PR workflow: frozen pnpm install, format, lint, typecheck, unit/integration/e2e tests, schema/content validation, web build, API build.
- Add Pages workflow for `main`, correct repository base path/hash navigation behavior, artifact validation, and deployment status reporting.
- Add separate Cloud Run API workflow using GitHub OIDC/workload identity federation; no long-lived service account key in repository secrets.
- Configure production/staging origins, runtime secret references, CORS, health/readiness probes, and rollout/rollback procedure.
- Require CI checks and block force-pushes on `main`.
- Preserve only public build-time settings in web bundle; verify PAT/session secrets stay server-side.

## Done When

- PR checks pass and cannot deploy production.
- Main commit deploys the matching Pages artifact and API revision with traceable SHA/revision.
- Rollback to last known-good web artifact/API revision is documented and tested.

## Verification

Use staging first. Test PR checks, main push, Pages URL/base path, API health/auth, failed-build block, deployment status, and rollback. Do not claim deployment complete from workflow dispatch alone.
