# TODO 03: Security and PAT Threat Model

**Status:** DONE
**Depends on:** TODO 01

## Accepted Constraints

- GitHub is the only identity provider and runtime data service.
- GitHub Pages is static hosting; no external API, database, secret store, or cloud runtime is permitted.
- GitHub sign-in accepts a PAT, verifies the real user at GitHub `/user`, and checks write permission for the fixed repository before granting access to `/home` or Studio.
- The PAT is held only in tab memory, never browser persistence, URL, logs, telemetry, build variables, or source.
- Studio is not linked anywhere in navigation. Direct access while signed out returns to `/`; route hiding is UX, not authorization.

## Threats and Controls

- **Fake identity:** use only GitHub's verified user response.
- **Unauthorized repository:** require GitHub `permissions.push` for the fixed owner/repository.
- **Wrong target or path:** hard-code owner/repository/branch and derive paths from schema-validated stable IDs.
- **Concurrent/partial writes:** create a single Git tree/commit and update the expected branch with `force: false`; preserve drafts on conflict.
- **Token persistence:** closure-backed memory reference only; clear on sign-out, failed authorization, GitHub 401, or tab close.
- **XSS/dependency compromise:** no unsafe HTML; restrictive CSP; review production dependencies. Residual risk remains that any executing script can use the in-memory PAT.
- **Over-scoped classic PAT:** tell users to use the least-privileged available token and revoke it if exposure is suspected.
- **Content leakage:** no local persistence; public repository contents are public if the target repository is public.

## Residual Risk

GitHub Pages cannot keep a PAT server-side. A malicious/compromised page script can act with the user's token during the active tab session. This risk is explicitly disclosed before use and accepted in ADR 0002 to satisfy the GitHub-only deployment requirement.

## Verification

Automated tests verify memory-only state, identity/repository permission checks, fixed-origin/path requests, 401 clearing, and non-force expected-head writes. Real browser authorization and publish tests are tracked separately; never put a production PAT in tests.
