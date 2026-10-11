# Local Environment Wiring and GitHub Tests

## Canonical Wiring

- `origin`: `https://github.com/c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3.git`
- Production branch: `main`
- Public Pages URL: `https://c7fb696fb9eabb971fd3becf7c0434aa.github.io/app-v9.1.1.3/`
- GitHub API origin: `https://api.github.com`
- Repository binding: `c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3`, branch `main`

## Current Verification (2026-10-11)

- Commit `5fec74cd927446cad6dde30735a0c8786e96c575` is deployed to `main`.
- Hosted CI run `38146479099` and Pages run `38146479101` succeeded for that commit.
- The Pages app shell returned HTTP 200 and loaded the current Vite bundles.
- Direct `#/studio` access while signed out redirected to `#/login` in the pre-refactor deployment. The corrected UX will return signed-out users to the public home.
- The prior bundle called same-origin `/api/*`, which returned 404 because no API server was deployed. This was the architecture mismatch being corrected: sign-in and repository operations now call GitHub directly.
- Do not use or repeat PATs in this report, remote URLs, shell history, env files, tests, or build configuration.

## Safe GitHub Acceptance

- Never use production `main` for an unapproved CRUD smoke test.
- For write acceptance, use an owner-approved test repository or test branch and a token scoped as narrowly as GitHub permits.
- Verify the commit SHA and contents on GitHub, then verify the corresponding Actions/Pages result separately.
- Clean up only test content explicitly created for that acceptance. Never force-push.
- Production publishing requires an explicit user review/confirmation in Studio.

## What to Record

Record repository, branch, verified actor login (not token), commit SHA, workflow run URL, deployment result, and cleanup result. Never record credentials or authorization headers.
