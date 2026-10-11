# TODO 08: GitHub PAT Authentication

**Status:** IN PROGRESS  
**Depends on:** TODO 03, TODO 04, TODO 07

## Goal

Authenticate directly with GitHub without an app server, external identity provider, or persisted browser credential.

## Work

- Send the user-entered PAT only to GitHub `/user` and the fixed repository endpoint over HTTPS.
- Verify the returned GitHub login/account ID and `permissions.push` before sign-in.
- Keep the token in a closure-backed memory reference only; clear it on failure, sign-out, or GitHub 401.
- Never persist the credential, send it to an app backend, or place it in logs, URLs, telemetry, or build output.
- Explain the residual XSS/dependency risk and recommend least available PAT permission.

## Done When

- Invalid tokens and users without target-repo push access cannot reach Studio.
- Signed-out direct Studio visits return to public home.
- The real account is displayed after successful GitHub verification.

## Verification

The UI suite contains one mocked successful identity/repository-permission flow. Negative token/permission cases, memory-clearing behavior, revoked-token response, and fixed-target enforcement need focused tests. Live browser acceptance requires an owner-authorized GitHub credential; never store real credentials in tests.

**Implemented locally:** GitHub `/user` and fixed repo permission verification, direct token-backed GitHub requests, memory-only token storage, sign-out/401 clearing. Real credential verification has not yet been completed in the current browser session.
