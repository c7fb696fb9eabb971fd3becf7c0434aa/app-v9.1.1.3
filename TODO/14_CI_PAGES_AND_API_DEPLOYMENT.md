# TODO 14: CI and GitHub Pages Deployment

**Status:** IN PROGRESS
**Depends on:** TODO 04, TODO 05, TODO 06, TODO 13

## Goal

Verify GitHub-native CI and Pages deployment for the static GitHub-only application.

## Work

- CI runs frozen pnpm install, format, lint, typecheck, tests, and build.
- Pushes to `main` build `apps/web` and deploy through GitHub Pages Actions.
- The static app has no runtime API origin or deployment secret dependency.
- Confirm branch protection requires CI and blocks force pushes.
- Track the Pages run and deployed commit SHA.

## Done When

- Hosted CI passes for the deployed commit.
- The matching Pages workflow succeeds and the site serves the new app.
- Branch-protection/Pages settings are confirmed and rollback procedure is documented.

## Verification

**Verified (previous version):** commit `5fec74cd927446cad6dde30735a0c8786e96c575` passed CI and Pages deployment. The app shell returned HTTP 200. Current direct-GitHub auth changes are uncommitted and have not been deployed. Studio does not yet display the matching Actions/Pages run result.
