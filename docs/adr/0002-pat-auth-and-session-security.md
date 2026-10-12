# ADR 0002: GitHub PAT Authentication in a Static App

**Status:** Accepted with documented residual risk
**Date:** 2026-10-11

## Decision

1. The user enters a GitHub PAT in the sign-in page. The SPA sends it only to `https://api.github.com/user` and the fixed repository metadata endpoint over HTTPS.
2. The app displays the actual GitHub login and account ID returned by `/user`, and admits the user only when GitHub reports push permission on the configured repository.
3. **Amended 2026-10-12:** the verified token is kept in a closure-backed JavaScript memory reference and tab-scoped `sessionStorage` so the signed-in state survives page refreshes. On reload, the app revalidates the token with GitHub before restoring the verified identity and repository access. Sign-out and a GitHub 401 clear both copies. The token is not stored in localStorage, IndexedDB, Cache API, URLs, analytics, or an application server.
4. Every GitHub request goes to a fixed GitHub API origin and fixed repository path. No caller-provided owner, repository, branch, or arbitrary file path is accepted.
5. Repository records and media are read and written through GitHub Git Database endpoints. Publish creates one tree and one commit, then updates the expected branch without force.
6. The login screen discloses that page JavaScript can access the PAT while the user is signed in. Recommend least-privilege token scope, sign-out after use, and GitHub revocation if exposure is suspected.

## Threats and Controls

- **Fake identity:** only GitHub `/user` response establishes account identity.
- **Wrong account/repository:** compare verified identity and require push permission on the fixed repository before retaining the token.
- **PAT persistence/leakage:** tab-scoped `sessionStorage` survives refresh but is readable by page JavaScript and browser developer tools. It is cleared on sign-out and invalid-token response; it is never placed in URLs, logs, metrics, or bundles.
- **XSS/dependency compromise:** a running script can use the in-memory PAT. Restrict dependencies, avoid unsafe HTML, retain strict CSP, and state this residual risk plainly.
- **Unintended repository writes:** schema/path validation, explicit review, one complete Git tree/commit, expected-head check, and non-force ref update.
- **Concurrent commits:** GitHub rejects non-fast-forward ref updates; preserve the draft and require a reload/reconcile.
- **Invalid/revoked credential:** clear in-memory authentication on GitHub 401 and return to public home.

## Consequences

- This is the only current implementation that satisfies static GitHub Pages plus GitHub-only auth/data without an external runtime.
- A classic PAT can be broader than one repository. The application cannot reduce scopes already granted by GitHub.
- Reloading restores authentication only after GitHub revalidates the session-stored PAT. Closing the tab ends the session-storage lifetime. A running script can read the PAT; this does not defend against XSS or malicious browser extensions.
- GitHub API availability, rate limits, CORS behavior, repository permissions, and Actions/Pages availability are runtime dependencies.

## Current UI Scope

The `/backend` route currently renders an independent header and empty workspace panels. The draft
and publishing controls described by the architecture decision are not currently exposed in the
UI; the GitHub client publish primitive remains separately tested.

## Verification

Test real browser sign-in against GitHub, push permission denial, revoked credentials, read/publish round-trip on an explicitly approved test target, stale-head conflict, sign-out, reload, session-scoped restoration, and absence from unintended persistence/logs/bundles. Never include a production PAT in fixtures or commit it.
