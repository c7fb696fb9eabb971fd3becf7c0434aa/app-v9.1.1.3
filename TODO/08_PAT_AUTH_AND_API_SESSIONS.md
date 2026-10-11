# TODO 08: PAT Verification and API Sessions

**Status:** IN PROGRESS  
**Depends on:** TODO 03, TODO 04, TODO 07

## Goal

Implement real GitHub account verification and scoped API sessions; remove fake/local sign-in entirely.

## Work

- Add sign-in endpoint that accepts a PAT only over TLS, calls GitHub `/user`, and verifies write permission to the fixed repository.
- Return real account identity and a short-lived app session; no synthetic users, email-only auth, OAuth callback fabrication, or developer bypass.
- Implement session expiry, logout/revocation, rate limits, origin checks, error redaction, and backend storage/crypto exactly as approved in TODO 03.
- Decide explicit OAuth behavior: supplied client ID is not used by PAT login; do not silently mix PAT and OAuth identity models.
- Ensure browser code clears the PAT field after exchange and keeps only transient app session state in memory.

## Done When

- UI shows the verified GitHub login and repository access state.
- Invalid/revoked/no-write identities cannot reach mutation endpoints.
- No credential is present in web bundle, localStorage, IndexedDB, URL, analytics, or logs.

## Verification

Use an isolated test account and disposable credentials. Test success, invalid, revoked, no repo access, no write access, expiry, logout, API restart/scale-out, CORS, and secret redaction. Never place real PATs in test fixtures.

**Local evidence:** The API verifies GitHub identity and write access to the fixed repository before creating an opaque session. Firestore stores the hashed session lookup key and KMS-encrypted PAT; application expiry and logout revocation are tested with synthetic dependencies. Browser auth keeps the session only in memory, clears it on expiry/401/logout, and never persists the PAT. API responses are no-store and use request IDs. API unit tests (19) and web tests (14) pass.

**Not verified:** Live disposable-PAT cases, Cloud Run restart/scale-out, Firestore TTL, KMS/IAM, deployed CORS/TLS, and edge rate limiting require provisioned infrastructure and an isolated account.
