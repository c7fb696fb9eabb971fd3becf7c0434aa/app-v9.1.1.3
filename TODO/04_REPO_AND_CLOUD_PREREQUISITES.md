# TODO 04: Repository, GitHub, and Cloud Prerequisites

**Status:** IN PROGRESS  
**Depends on:** TODO 02, TODO 03

## Goal

Prepare the exact GitHub repository and API hosting environment without placing user secrets in source control.

## Current Environment Check

- Verified 2026-10-10: Node.js `v24.21.0`, Corepack-pinned pnpm `12.11.2`, and the exact `origin` URL.
- Read-only `git ls-remote origin HEAD refs/heads/main` reports `85874a42bff26c464ac3cb6d5fcd220cd2392fc2` for both `HEAD` and `main`.
- Public GitHub metadata confirms `c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3`, default branch `main`, `has_pages: true`, and the canonical homepage URL. Anonymous branch-protection settings returned HTTP 401; the Pages settings endpoint did not return configuration, so required checks/protection and publishing source remain unverified.
- The public Pages URL currently serves the previous legacy bundle. Its callback fabricates a `github-developer` identity and writes `greenapp_user` to `localStorage`; do not use that live UI for authentication or PAT entry. The new local scaffold intentionally does not simulate success.
- `git push -u origin main` completed with `Everything up-to-date`; no uncommitted scaffold files were pushed. This no-op push does not prove a remote ref update was authorized.
- The current workspace has local changes and untracked scaffold files. Local `user.name` and `user.email` are not configured; do not create commits until the operator configures their own author identity.
- `gh` and `gcloud` are not installed. Cloud Run project/region, Google Cloud credentials, Firestore/KMS setup, staging resources, GitHub Pages settings, and branch protection remain unverified/unavailable. This blocks production API deployment and staging acceptance, not local scaffold development.
- A historical disposable-ref dry-run is documented in [Local Environment Wiring](../docs/reports/LOCAL_ENVIRONMENT_WIRING.md); it is not treated as current proof of branch protection or a production write.

## Work

- Confirm repo owner, repo name, canonical Pages URL, default branch, existing Pages settings, branch protection, and required checks.
- Decide Pages publishing mode and set up a deployment workflow that exists in the repository before relying on it.
- Provision/confirm Cloud Run project, region, service account, workload identity federation for CI, secret store, and session store if the ADR requires one.
- Configure allowed production/local web origins, API base URLs, health endpoint, and DNS/custom-domain constraints.
- Ensure the operator can set `user.name`/`user.email`; use Git Credential Manager for human Git access.
- Create staging resources and a test repository/branch so commit/delete/asset tests never use production content.
- Keep local app/API development separate from production Cloud Run setup; TODO 14 cannot deploy until the missing project/IAM/secret-store inputs are supplied.

## Done When

- Required repository/cloud IDs and access owners are documented, excluding all credentials.
- CI identity can deploy API and Pages without a long-lived cloud key.
- Branch protection requires CI and blocks force-pushes to `main`.
- Staging write access is verified using a limited test credential.

## Verification

Record read-only repo check, staging push test, Pages configuration, cloud health check, and secret-store access test. Do not publish to production during this item.
