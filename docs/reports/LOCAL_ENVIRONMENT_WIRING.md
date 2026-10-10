# Local Environment Wiring and Git Tests

## Canonical Wiring

- `origin`: `https://github.com/c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3.git`
- Production branch: `main`
- Public Pages URL: `https://c7fb696fb9eabb971fd3becf7c0434aa.github.io/app-v9.1.1.3/`
- Local API URL: reserve `http://localhost:8787` for development; production API URL is a public non-secret setting injected into the web build.
- GitHub PAT: enter interactively in the app/API sign-in flow. Do not put it in this report, Git remote URL, PowerShell history, `.env` files, or command arguments.

## Current Reset-State Facts

git remote -v
git ls-remote origin HEAD
At reset time the workspace had no `.git` metadata. It now has a new local Git repository with an empty `main` and the exact `origin` above. `git ls-remote origin HEAD` succeeded; the production branch was `4e7f74cb4ea629e9168c816b4dda9ad73d2e6526` at the last check. The GitHub CLI is unavailable.

A disposable local commit succeeded. Its first push dry-run was denied because the previously cached GitHub account lacked write access. After browser reauthentication, a second test commit (`da2faf0`) passed `git push --dry-run` to `test/github-write-dry-run`; that branch was removed and no remote ref changed. No PAT is stored in the repository or report. The local `main` is intentionally empty/uncommitted until the confirmed docs-only replacement is committed as a normal child of the fetched remote `main`.

The reports-only replacement removes the existing Pages workflow along with the old app. The currently published deployment may remain online, but future commits will not rebuild or publish until the new app's workflow is added.

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
