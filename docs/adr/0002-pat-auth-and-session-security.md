# ADR 0002: Classic PAT Authentication and Session Security

**Status:** Proposed baseline; cloud controls require TODO 04 verification  
**Date:** 2026-10-10

## Context

The user requires actual GitHub account verification with a classic PAT, repository write authorization, and no credential/content persistence in browser storage. GitHub Pages and the Cloud Run API are different origins, so cross-site cookies are not a reliable sole session transport.

## Decision

1. The browser sends the entered PAT once over TLS to the API auth endpoint. It is never written to web build config, URL, local storage, IndexedDB, Cache API, analytics, or logs.
2. The API validates the PAT using GitHub `/user`, obtains the actual login/account ID, reads the fixed repository metadata with the PAT, and verifies the account has effective write access. Valid identity without target-repo write permission is rejected.
3. The token is encrypted at rest with Cloud KMS and stored in a TTL-bounded Firestore session record. Store a hash of the opaque session ID for lookup; retain only encrypted PAT, account ID, target repo binding, issued/expiry time, and audit metadata. TODO 04 must confirm KMS/Firestore IAM, TTL, cost, and region.
4. Generate a cryptographically random opaque bearer session ID. Return it only after successful validation. The browser keeps it in volatile memory and sends it in the API Authorization header. Reload requires PAT re-entry. Logout/expiry deletes or revokes the session. Do not use an unencrypted long-lived browser cookie across `github.io` and `run.app`.
5. Every protected endpoint checks session expiry, account binding, and the fixed repo/branch. The server ignores client attempts to choose another owner, repo, branch, or raw path.
6. Restrict CORS to configured local/staging/production origins; use TLS, strict CSP, input/output schemas, request-size limits, rate limits, and safe error mapping. Bearer API calls do not use ambient cookies, reducing CSRF risk; strict Origin checks remain defense in depth.
7. A classic PAT may be broader than a fine-grained token. Require the minimum available classic scopes needed for repository operations, show the actual verified account/repo permission, and document revocation. Do not claim that a classic PAT is repo-scoped if its GitHub scope grants wider account access.
8. Redact PATs/session IDs/Authorization headers from application, proxy, exception, and CI logs. Never return the PAT after sign-in. Session compromise handling invalidates app sessions; PAT revocation remains the user's GitHub action.

## Threats and Controls

- **Fake identity:** only GitHub `/user` response establishes identity; never synthesize a user object.
- **Wrong account/repo:** server-fixed repo plus explicit permission check on every write session.
- **PAT theft from browser storage/logs:** PAT leaves the browser after exchange; short-lived opaque session is memory-only; redaction tests.
- **Cross-site request:** bearer header, origin allowlist, no ambient cookie authority, schema validation.
- **XSS:** strict CSP, no unsafe HTML, output escaping, dependency/security review; an active XSS can still use an in-memory session, so limit expiry and scope.
- **Session database disclosure:** encrypted PAT via KMS; store a hash of session ID; TTL and IAM least privilege.
- **Concurrent/forged write:** fixed allowed repository/path mapping, schema validation, expected-head commit, non-force ref update.

## Verification Requirements

Automated tests use synthetic credentials or a disposable GitHub test repository. Test invalid/revoked PAT, wrong user, no repo access, no write role, expired/revoked app session, origin rejection, no secret in logs/storage/bundle, session deletion on logout, and token encryption/decryption failure. A production credential is never a test fixture.
