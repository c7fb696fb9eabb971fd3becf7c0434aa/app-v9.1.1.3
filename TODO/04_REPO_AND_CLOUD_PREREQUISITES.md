# TODO 04: GitHub Repository and Pages Prerequisites

**Status:** IN PROGRESS  
**Depends on:** TODO 02, TODO 03

## Goal

Use only the configured GitHub repository, GitHub API, GitHub Actions, and GitHub Pages. No outside backend, database, identity provider, or cloud service is part of the product.

## Current Environment

- Node `v24.21.0`, pnpm `12.11.2`, and the expected GitHub `origin` are configured.
- Repository: `c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3`, production branch `main`.
- Public Pages URL: `https://c7fb696fb9eabb971fd3becf7c0434aa.github.io/app-v9.1.1.3/`.
- `.github/workflows/ci.yml` verifies pushes and PRs; `.github/workflows/deploy-pages.yml` deploys the static app on `main`.
- The Pages deployment was verified successful at commit `5fec74cd927446cad6dde30735a0c8786e96c575`; CI and Pages workflow succeeded.
- Branch protection and Pages settings are not independently verified. The Pages action deployment currently responds HTTP 200.

## Work

- Keep repository binding fixed in the web GitHub client.
- Verify token access and push permission through the real GitHub API.
- Verify GitHub Pages base path, source branch, Actions permissions, and required checks.
- Test real read/publish on an explicitly approved safe target before writing production content.
- Keep credentials out of Git, local files, build settings, logs, and workflow inputs.

## Done When

- GitHub API access to the fixed repository and Pages publishing are verified.
- CI required checks and branch protections are confirmed.
- Live login/read/commit/deploy acceptance succeeds with explicit owner approval of each production write.

## Verification

Record GitHub branch, commit SHA, workflow run, deployment URL/status, and cleanup outcome. Never use production changes for a smoke test without explicit publish approval.
