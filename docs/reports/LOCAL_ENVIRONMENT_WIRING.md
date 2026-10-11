# Local Environment Wiring and Git Tests

## Canonical Wiring

- `origin`: `https://github.com/c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3.git`
- Production branch: `main`
- Public Pages URL: `https://c7fb696fb9eabb971fd3becf7c0434aa.github.io/app-v9.1.1.3/`
- Local API URL: reserve `http://localhost:8787` for development; production API URL is a public non-secret setting injected into the web build.
- GitHub PAT: enter interactively in the app/API sign-in flow. Do not put it in this report, Git remote URL, PowerShell history, `.env` files, or command arguments.

## Current Repository Facts (2026-10-10)

- The exact `origin` is configured, and local `main` tracks `origin/main`.
- Read-only `git ls-remote origin HEAD refs/heads/main` reported `85874a42bff26c464ac3cb6d5fcd220cd2392fc2` for both refs.
- Public GitHub metadata confirms the exact owner/repository, `main` as default branch, Pages enabled, and the canonical homepage. Anonymous branch-protection lookup returned HTTP 401; Pages settings were not returned by the API.
- The canonical live Pages URL still serves the old legacy bundle. Its OAuth callback fabricates `github-developer` and persists `greenapp_user` to browser `localStorage`; do not use this live UI for authentication or PAT entry. The current local scaffold deliberately rejects fake auth.
- `git push -u origin main` completed with `Everything up-to-date`. It transferred no commits, so it is not evidence that a new ref update was authorized.
- The scaffold and TODO tree currently have local modifications/untracked files and have not been committed or pushed. Local Git author name/email are unset.
- The `gh` and `gcloud` CLIs are unavailable. GitHub Pages settings, branch protection, Cloud Run, Firestore/KMS, and staging access have not been verified from this environment.
- A historical disposable-ref dry-run is retained below as historical evidence only; it does not replace current staging verification.

The local scaffold includes `.github/workflows/ci.yml` for verification and `.github/workflows/deploy-pages.yml` to build/deploy the web application to GitHub Pages on `main`. The Pages workflow does not deploy the API or provision authentication infrastructure. Hosted CI/deployment must be verified after the changes are pushed; repository Pages settings and the required `VITE_API_BASE_URL` Actions variable have not been independently confirmed.

## Safe Commit/Push Smoke Test

For future application tests, do not test by pushing to production `main`. Use an authorized, disposable test repository or a dedicated non-production branch, after confirming branch protections and CI behavior:

1. Create a local test branch and a harmless test fixture.
2. Run schema validation and the full local checks.
3. Create a commit and verify its parent, tree, author, and message locally with `git show --stat --oneline HEAD`.
4. Use `git push --dry-run origin HEAD:refs/heads/test/green-docs-connectivity` to check remote authentication/ref update capability without updating the remote ref.
5. In a disposable repository only, perform a real push; verify with `git ls-remote origin refs/heads/test/green-docs-connectivity` and inspect the commit on GitHub.
6. Delete the disposable branch after recording the result. Never force-push and never run the smoke test against `main`.

The application integration test should use a test GitHub repository or a protected temporary branch and an isolated test credential. It must commit a generated page/card fixture as one atomic commit, verify the returned commit SHA and file contents, verify Actions/Pages status, and clean up only its own fixture/branch. Production writes require an explicit user-confirmed Publish action.

## What Must Be Reported

Record remote URL, tested branch, actor login (never token), commit SHA, dry-run/real-push outcome, workflow run URL, deployment result, and cleanup result. Redact tokens and authorization headers. A failed auth check is a test failure; do not work around it by embedding a token in a URL or script.
