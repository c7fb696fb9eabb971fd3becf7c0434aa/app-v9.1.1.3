# TODO 15: Quality, Security, and Operations Gates

**Status:** NOT STARTED  
**Depends on:** TODO 05 through TODO 14 (tests are added continuously; this item closes gaps)

## Goal

Prove the entire system meets security, correctness, accessibility, observability, and maintainability requirements before staging acceptance.

## Work

- Complete unit, API integration, repository adapter, UI, browser E2E, and deployment smoke tests.
- Add negative security suite: PAT redaction, unauthorized repo/path, expired/revoked session, CORS/CSRF, XSS/CSP, path traversal, MIME/size abuse, race/conflict, rate limit.
- Add structured logs with request ID, verified actor ID, repo, commit SHA, deployment result; redact all secrets.
- Add health/readiness endpoints, metrics for login failures, GitHub API failures/rate limits, commit errors, workflow duration, deployment status.
- Add accessibility checks, responsive screenshot suite, reduced-motion checks, and performance/bundle budgets.
- Document incident response, PAT revocation, session invalidation, backup/recovery, rollback, and owner runbook.

## Done When

- All required checks are green and failures are actionable.
- A secret scan confirms no credentials in repo history added by the new work, bundles, logs, or artifacts.
- Operational owner can diagnose auth, GitHub, CI, and Pages failures using the runbook.

## Verification

Run clean-clone CI, full E2E on staging, secret/dependency scans, accessibility automation, and manual sign-in-to-published-card acceptance walkthrough.
