# TODO 09C: Direct Secret Studio Route and Isolation

**Status:** IN PROGRESS  
**Depends on:** TODO 01, TODO 02, TODO 08, TODO 09

## Goal

Make Secret Studio a separate, directly addressable application route without exposing a Studio link in the right sidebar or ordinary public navigation.

## Work

- Use the stable hash route `#/studio`; do not preserve an unauthorized requested route through login.
- Do not render Secret Studio links, labels, or actions in the right drawer/global navigation.
- Load Studio only when a developer manually visits the route.
- Enforce verified GitHub memory authentication and repository authorization on the route and each GitHub operation. Route secrecy is not a security control.
- Isolate Studio layout/state/error boundaries and avoid global shell state leaking into the editor.
- Ensure `/` and `/home` render without loading Studio chunks; `/home` loads only its own GitHub read snapshot.

## Done When

- Right sidebar has only public navigation/auth actions and no Studio entry.
- Direct `#/studio` while signed out redirects to public `/`; sign-in always goes to `/home`. An authenticated developer must enter `#/studio` manually.
- Direct `#/studio` for a valid GitHub user without repo write access remains blocked.
- Public landing and authenticated documentation home continue to work when the Studio chunk is unavailable.

## Verification

Browser E2E asserts no Studio link anywhere, manual direct-route behavior, signed-out/unauthorized guard, login always redirecting to `/home`, and independent route error/loading boundaries.

**Local evidence:** Studio is a manually addressed, lazy-loaded route guarded by in-memory verified auth. Tests cover signed-out Studio redirect, no visible Studio link, login-to-`/home`, authenticated root redirect, and route-specific boundaries.

**Not verified:** Full cross-browser E2E remains outstanding. Live sign-in and fixed-repository reads succeeded on the deployed GitHub-only implementation.
