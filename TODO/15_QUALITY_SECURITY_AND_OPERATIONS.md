# TODO 15: Quality, Security, and Operations Gates

**Status:** NOT STARTED  
**Depends on:** TODO 05 through TODO 14 (tests are added continuously; this item closes gaps)

## Goal

Prove the entire system meets security, correctness, accessibility, observability, and maintainability requirements before staging acceptance.

## Work

- Complete schema, GitHub-client, UI, browser E2E, and deployment acceptance tests.
- Add negative security suite: PAT absence from persistence/bundles, unauthorized repo/path, revoked token, XSS/CSP, path traversal, MIME/size abuse, race/conflict, rate limit.
- Keep client diagnostics limited to non-secret event names/status codes; never log tokens or repository content.
- Define GitHub API failure, Actions workflow, and Pages deployment diagnostics and support guidance.
- Add accessibility checks, responsive screenshot suite, reduced-motion checks, and performance/bundle budgets.
- Document incident response, PAT revocation, tab-memory auth clearing, Git recovery, Pages rollback, and owner runbook.

## Done When

- All required checks are green and failures are actionable.
- A secret scan confirms no credentials in repo history added by the new work, bundles, logs, or artifacts.
- Operational owner can diagnose auth, GitHub, CI, and Pages failures using the runbook.

## Verification

Run clean-clone CI, full E2E on staging, secret/dependency scans, accessibility automation, and manual sign-in-to-published-card acceptance walkthrough.
